const request = require('supertest');
const express = require('express');

const app = express();
app.use(express.json());

let basket = { _id: 'b1', userId: 'user-123', items: [] };

app.post('/baskets', (req, res) => {
  basket = { _id: 'b1', userId: req.body.userId || 'user-123', items: [] };
  res.status(201).json({ success: true, data: basket });
});

app.post('/baskets/:id/items', (req, res) => {
  const { cakeId, quantity } = req.body;
  if (!cakeId || !quantity || quantity <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid payload' });
  }
  basket.items.push({ _id: 'i1', cakeId, quantity, price: 350 });
  res.status(200).json({ success: true, data: basket });
});

app.post('/orders/checkout', (req, res) => {
  const { basketId, userId } = req.body;
  if (!basketId || !userId) return res.status(400).json({ success: false, message: 'Invalid checkout payload' });
  if (basket.items.length === 0) return res.status(400).json({ success: false, message: 'Basket is empty' });

  const totalAmount = basket.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const order = { _id: 'o1', userId, items: basket.items, totalAmount, status: 'CONFIRMED' };
  basket.items = [];
  res.status(201).json({ success: true, data: order });
});

describe('Order Service APIs', () => {
  it('POST /baskets should create a new basket', async () => {
    const res = await request(app).post('/baskets').send({ userId: 'user-123' });
    expect(res.statusCode).toEqual(201);
    expect(res.body.data.userId).toBe('user-123');
  });

  it('POST /baskets/:id/items should add cake to basket', async () => {
    const res = await request(app).post('/baskets/b1/items').send({ cakeId: 'c1', quantity: 2 });
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].quantity).toBe(2);
  });

  it('POST /orders/checkout should complete checkout', async () => {
    const res = await request(app).post('/orders/checkout').send({ basketId: 'b1', userId: 'user-123' });
    expect(res.statusCode).toEqual(201);
    expect(res.body.data.status).toBe('CONFIRMED');
    expect(res.body.data.totalAmount).toBe(700);
  });
});
