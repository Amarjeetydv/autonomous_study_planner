const AppError = require('../utils/AppError');

const notFoundMiddleware = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

module.exports = notFoundMiddleware;
