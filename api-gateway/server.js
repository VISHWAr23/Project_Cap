const express = require('express');
const cors = require('cors');
const proxy = require('express-http-proxy');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const requestLogger = require('./middleware/requestLogger');
const errorMiddleware = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:3001';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3002';
const RATING_SERVICE_URL = process.env.RATING_SERVICE_URL || 'http://localhost:3003';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';

app.use(cors());
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'api-gateway'
  });
});

const proxyOptions = (prefix) => ({
  proxyReqPathResolver: (req) => prefix + (req.url === '/' ? '' : req.url),
  parseReqBody: false
});

// Proxy route rules
app.use('/api/cakes', proxy(CATALOG_SERVICE_URL, proxyOptions('/cakes')));
app.use('/api/baskets', proxy(ORDER_SERVICE_URL, proxyOptions('/baskets')));
app.use('/api/orders', proxy(ORDER_SERVICE_URL, proxyOptions('/orders')));
app.use('/api/ratings', proxy(RATING_SERVICE_URL, proxyOptions('/ratings')));
app.use('/api/notifications', proxy(NOTIFICATION_SERVICE_URL, proxyOptions('/notifications')));

// Serve static frontend files from public directory
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Fallback to index.html for frontend routing
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(publicPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend index.html not found');
  }
});

// Error handling middleware
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`API Gateway listening on port ${PORT}`);
  console.log(`Catalog Proxy      -> ${CATALOG_SERVICE_URL}/cakes`);
  console.log(`Order Proxy        -> ${ORDER_SERVICE_URL}/baskets & /orders`);
  console.log(`Rating Proxy       -> ${RATING_SERVICE_URL}/ratings`);
  console.log(`Notification Proxy -> ${NOTIFICATION_SERVICE_URL}/notifications`);
  console.log(`=================================`);
});

module.exports = app;
