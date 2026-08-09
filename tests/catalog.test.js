const request = require('supertest');
const express = require('express');

// Mock Cake model and controller behavior for simple Jest supertest verification
const app = express();
app.use(express.json());

const cakes = [
  { _id: 'c1', name: 'Chocolate Fudge', category: 'Chocolate', price: 350, availability: true },
  { _id: 'c2', name: 'Vanilla Birthday', category: 'Birthday', price: 450, availability: true }
];

app.get('/cakes', (req, res) => {
  let result = [...cakes];
  if (req.query.name) {
    result = result.filter(c => c.name.toLowerCase().includes(req.query.name.toLowerCase()));
  }
  if (req.query.category) {
    result = result.filter(c => c.category.toLowerCase() === req.query.category.toLowerCase());
  }
  res.status(200).json({ success: true, count: result.length, data: result });
});

app.get('/cakes/:id', (req, res) => {
  const cake = cakes.find(c => c._id === req.params.id);
  if (!cake) return res.status(404).json({ success: false, message: 'Cake not found' });
  res.status(200).json({ success: true, data: cake });
});

describe('Catalog Service APIs', () => {
  it('GET /cakes should return all cakes', async () => {
    const res = await request(app).get('/cakes');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it('GET /cakes/:id should return single cake', async () => {
    const res = await request(app).get('/cakes/c1');
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.name).toBe('Chocolate Fudge');
  });

  it('GET /cakes with name & category filter', async () => {
    const res = await request(app).get('/cakes?category=Birthday');
    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].category).toBe('Birthday');
  });
});
