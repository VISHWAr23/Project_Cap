const request = require('supertest');
const express = require('express');

const app = express();
app.use(express.json());

const notifications = [];

app.get('/notifications/user/:userId', (req, res) => {
  const userNotifs = notifications.filter(n => n.userId === req.params.userId);
  res.status(200).json({ success: true, count: userNotifs.length, data: userNotifs });
});

// Helper handler to simulate RabbitMQ event creation logic
function handleOrderCompletedEvent(event) {
  const existing = notifications.find(n => n.eventId === event.eventId);
  if (existing) return false;
  notifications.push({
    _id: 'n1',
    eventId: event.eventId,
    orderId: event.orderId,
    userId: event.userId,
    message: event.message,
    status: 'SENT'
  });
  return true;
}

describe('Notification Service Logic', () => {
  it('Should handle OrderCompleted event idempotently', () => {
    const event = {
      eventId: 'evt-1',
      orderId: 'o1',
      userId: 'user-123',
      message: 'Your order has been confirmed.'
    };

    const firstResult = handleOrderCompletedEvent(event);
    expect(firstResult).toBe(true);

    const secondResult = handleOrderCompletedEvent(event);
    expect(secondResult).toBe(false); // Idempotent check prevents duplicate notification
  });

  it('GET /notifications/user/user-123 should return user notifications', async () => {
    const res = await request(app).get('/notifications/user/user-123');
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].status).toBe('SENT');
  });
});
