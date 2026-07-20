const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const errorsMap = {};
    result.array().forEach((error) => {
      errorsMap[error.path] = error.msg;
    });

    return res.status(400).json({
      success: false,
      message: Object.values(errorsMap)[0] || 'Validation error occurred',
      errors: errorsMap
    });
  }

  return next();
};

module.exports = validateRequest;
