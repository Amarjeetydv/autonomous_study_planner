const { body, param } = require('express-validator');

const sendMessageValidators = [
  body('conversationId').isString().notEmpty().withMessage('Valid conversationId thread string is required'),
  body('message').isString().notEmpty().withMessage('Message text is required'),
];

const conversationIdParamValidator = [
  param('conversationId').isString().notEmpty().withMessage('conversationId parameter is required'),
];

module.exports = {
  sendMessageValidators,
  conversationIdParamValidator,
};
