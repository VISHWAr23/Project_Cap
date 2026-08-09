const amqp = require('amqplib');
const Notification = require('./models/Notification');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const EXCHANGE_NAME = 'cake-events';
const QUEUE_NAME = 'order-notifications';
const ROUTING_KEY = 'order.completed';

const startConsumer = async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);

    console.log(`Notification Service listening for '${ROUTING_KEY}' events on queue '${QUEUE_NAME}'`);

    channel.consume(QUEUE_NAME, async (msg) => {
      if (!msg) return;

      try {
        const eventData = JSON.parse(msg.content.toString());
        console.log(`Received RabbitMQ Event: ${eventData.eventType || 'OrderCompleted'} (ID: ${eventData.eventId})`);

        const { eventId, orderId, userId, message } = eventData;

        // Prevent duplicate processing using eventId
        const existingNotification = await Notification.findOne({ eventId });
        if (existingNotification) {
          console.log(`Duplicate event detected (eventId: ${eventId}). Skipping notification creation.`);
          channel.ack(msg);
          return;
        }

        // Save new notification to MongoDB
        const notification = await Notification.create({
          eventId,
          orderId,
          userId,
          message: message || `Your order ${orderId} has been confirmed.`,
          type: 'IN_APP',
          status: 'SENT'
        });

        console.log(`Order confirmation sent to ${userId} (Notification ID: ${notification._id})`);
        channel.ack(msg);
      } catch (err) {
        console.error('Error processing notification event:', err.message);
        // Ack message to avoid infinite retries in basic demo setup
        channel.ack(msg);
      }
    });

    connection.on('error', (err) => {
      console.error('RabbitMQ connection error in Notification Service:', err.message);
      setTimeout(startConsumer, 5000);
    });

    connection.on('close', () => {
      console.warn('RabbitMQ connection closed in Notification Service. Retrying in 5s...');
      setTimeout(startConsumer, 5000);
    });
  } catch (error) {
    console.error('RabbitMQ consumer connection failed in Notification Service:', error.message);
    console.log('Will retry connecting to RabbitMQ in 5 seconds...');
    setTimeout(startConsumer, 5000);
  }
};

module.exports = { startConsumer };
