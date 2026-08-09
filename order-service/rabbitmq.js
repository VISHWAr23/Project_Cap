const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const EXCHANGE_NAME = 'cake-events';
const ROUTING_KEY = 'order.completed';

let channel = null;

const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    console.log(`Order Service connected to RabbitMQ exchange '${EXCHANGE_NAME}'`);

    connection.on('error', (err) => {
      console.error('RabbitMQ connection error in Order Service:', err.message);
      setTimeout(connectRabbitMQ, 5000);
    });

    connection.on('close', () => {
      console.warn('RabbitMQ connection closed in Order Service. Retrying in 5s...');
      setTimeout(connectRabbitMQ, 5000);
    });
  } catch (error) {
    console.error('RabbitMQ initial connection failed in Order Service:', error.message);
    console.log('Will retry connecting to RabbitMQ in 5 seconds...');
    setTimeout(connectRabbitMQ, 5000);
  }
};

const publishOrderCompletedEvent = (eventData) => {
  if (!channel) {
    console.warn('RabbitMQ channel not ready. Cannot publish OrderCompleted event.');
    return false;
  }

  try {
    const messageBuffer = Buffer.from(JSON.stringify(eventData));
    channel.publish(EXCHANGE_NAME, ROUTING_KEY, messageBuffer, { persistent: true });
    console.log(`Published OrderCompleted event to RabbitMQ: eventId=${eventData.eventId}`);
    return true;
  } catch (error) {
    console.error('Failed to publish OrderCompleted event to RabbitMQ:', error.message);
    return false;
  }
};

module.exports = {
  connectRabbitMQ,
  publishOrderCompletedEvent
};
