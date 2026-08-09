const express = require('express');
const cors = require('cors');
const proxy = require('express-http-proxy');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:3001';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3002';
const RATING_SERVICE_URL = process.env.RATING_SERVICE_URL || 'http://localhost:3003';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';

app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'api-gateway'
  });
});

// Proxy route rules
app.use('/api/cakes', proxy(CATALOG_SERVICE_URL, {
  proxyReqPathResolver: (req) => '/cakes' + req.url
}));

app.use('/api/baskets', proxy(ORDER_SERVICE_URL, {
  proxyReqPathResolver: (req) => '/baskets' + req.url
}));

app.use('/api/orders', proxy(ORDER_SERVICE_URL, {
  proxyReqPathResolver: (req) => '/orders' + req.url
}));

app.use('/api/ratings', proxy(RATING_SERVICE_URL, {
  proxyReqPathResolver: (req) => '/ratings' + req.url
}));

app.use('/api/notifications', proxy(NOTIFICATION_SERVICE_URL, {
  proxyReqPathResolver: (req) => '/notifications' + req.url
}));

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
app.use((err, req, res, next) => {
  console.error('API Gateway Proxy Error:', err.message);
  res.status(502).json({
    success: false,
    message: 'Bad Gateway: Microservice communication failed or service is offline',
    error: err.message
  });
});

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
