const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const requestLogger = require('./middleware/requestLogger');
const errorMiddleware = require('./middleware/errorMiddleware');
const notificationRoutes = require('./routes/notificationRoutes');
const { startConsumer } = require('./rabbitmq');

const app = express();
const PORT = process.env.PORT || 3004;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/notification_db';

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/notifications', notificationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'notification-service'
  });
});

// Modular Error Handling Middleware
app.use(errorMiddleware);

// Database Connection & Server Start
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log(`Database connected: ${MONGO_URI}`);
    startConsumer();
    app.listen(PORT, () => {
      console.log(`Notification Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failure:', err.message);
  });

module.exports = app;
