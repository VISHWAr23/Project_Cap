const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error('API Gateway Proxy Error:', err.message);
  return res.status(502).json({
    success: false,
    message: 'Bad Gateway: Microservice communication failed or service is offline',
    error: err.message
  });
};

module.exports = errorMiddleware;
