const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const basketRoutes = require('./routes/basketRoutes');
const orderRoutes = require('./routes/orderRoutes');
const { connectRabbitMQ } = require('./rabbitmq');

const app = express();
const PORT = process.env.PORT || 3002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/order_db';

app.use(cors());
app.use(express.json());

// Routes
app.use('/baskets', basketRoutes);
app.use('/orders', orderRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'order-service'
  });
});

// Basic Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error in order-service:', err.message);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Database Connection & Server Start
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log(`Database connected: ${MONGO_URI}`);
    connectRabbitMQ();
    app.listen(PORT, () => {
      console.log(`Order Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failure:', err.message);
  });

module.exports = app;
