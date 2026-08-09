const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const ratingRoutes = require('./routes/ratingRoutes');

const app = express();
const PORT = process.env.PORT || 3003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rating_db';

app.use(cors());
app.use(express.json());

// Routes
app.use('/ratings', ratingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'rating-service'
  });
});

// Basic Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error in rating-service:', err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Database Connection & Server Start
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log(`Database connected: ${MONGO_URI}`);
    app.listen(PORT, () => {
      console.log(`Rating Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failure:', err.message);
  });

module.exports = app;
