const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [notification-service] ${req.method} ${req.originalUrl || req.url}`);
  next();
};

module.exports = requestLogger;
