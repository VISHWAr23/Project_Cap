const request = require('supertest');
const express = require('express');

const app = express();
app.use(express.json());

const ratings = [];

app.post('/ratings', (req, res) => {
  const { cakeId, userId, rating, review } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating between 1 and 5 required' });
  }
  const newRating = { _id: 'r1', cakeId, userId, rating: Number(rating), review };
  ratings.push(newRating);
  res.status(201).json({ success: true, data: newRating });
});

app.get('/ratings/cake/:cakeId/average', (req, res) => {
  const cakeRatings = ratings.filter(r => r.cakeId === req.params.cakeId);
  if (cakeRatings.length === 0) {
    return res.status(200).json({ cakeId: req.params.cakeId, averageRating: 0, totalRatings: 0 });
  }
  const avg = cakeRatings.reduce((sum, r) => sum + r.rating, 0) / cakeRatings.length;
  res.status(200).json({ cakeId: req.params.cakeId, averageRating: avg, totalRatings: cakeRatings.length });
});

describe('Rating Service APIs', () => {
  it('POST /ratings should create a rating', async () => {
    const res = await request(app).post('/ratings').send({
      cakeId: 'c1',
      userId: 'user-123',
      rating: 5,
      review: 'Tastes divine!'
    });
    expect(res.statusCode).toEqual(201);
    expect(res.body.data.rating).toBe(5);
  });

  it('GET /ratings/cake/:cakeId/average should calculate correct average', async () => {
    const res = await request(app).get('/ratings/cake/c1/average');
    expect(res.statusCode).toEqual(200);
    expect(res.body.averageRating).toBe(5);
    expect(res.body.totalRatings).toBe(1);
  });
});
