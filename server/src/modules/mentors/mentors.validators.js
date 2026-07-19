const { body, param } = require('express-validator');

const requestLinkValidators = [
  body('mentorId').isMongoId().withMessage('Valid mentorId is required'),
];

const responseLinkValidators = [
  body('studentId').isMongoId().withMessage('Valid studentId is required'),
];

const leaveFeedbackValidators = [
  body('studentId').isMongoId().withMessage('Valid studentId is required'),
  body('goalId').isMongoId().withMessage('Valid goalId is required'),
  body('planId').isMongoId().withMessage('Valid planId is required'),
  body('taskId').optional().isMongoId().withMessage('taskId must be valid'),
  body('comment').isString().notEmpty().withMessage('comment text is required'),
  body('rating').optional().isInt({ min: 0, max: 5 }).withMessage('rating must be 0-5'),
];

const studentIdParamValidator = [
  param('studentId').isMongoId().withMessage('Valid studentId parameter is required'),
];

module.exports = {
  requestLinkValidators,
  responseLinkValidators,
  leaveFeedbackValidators,
  studentIdParamValidator,
};
