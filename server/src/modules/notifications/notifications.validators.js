const { param } = require('express-validator');

const notificationIdParamValidator = [
  param('id').isMongoId().withMessage('Valid notification ID parameter is required'),
];

module.exports = {
  notificationIdParamValidator,
};
