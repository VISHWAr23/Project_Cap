const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const requestLogger = require('./middleware/requestLogger');
const errorMiddleware = require('./middleware/errorMiddleware');
const basketRoutes = require('./routes/basketRoutes');
const orderRoutes = require('./routes/orderRoutes');
const { connectRabbitMQ } = require('./rabbitmq');

const app = express();
const PORT = process.env.PORT || 3002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/order_db';

app.use(cors());
app.use(express.json());
app.use(requestLogger);

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

// Modular Error Handling Middleware
app.use(errorMiddleware);

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
