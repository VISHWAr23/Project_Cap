const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [catalog-service] ${req.method} ${req.originalUrl || req.url}`);
  next();
};

module.exports = requestLogger;
