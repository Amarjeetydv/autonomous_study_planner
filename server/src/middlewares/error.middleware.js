const logger = require('../config/logger');

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const success = false;
  const message = err.message || 'Internal Server Error';
  const errors = err.errors || [];

  logger.error(message, {
    statusCode,
    path: req.originalUrl,
    method: req.method,
    stack: err.stack,
  });

  return res.status(statusCode).json({
    success,
    code: err.code || undefined,
    message,
    data: err.data || null,
    errors,
  });
};

module.exports = errorMiddleware;
