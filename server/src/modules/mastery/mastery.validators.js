const { body, param } = require('express-validator');

const updateMasteryValidators = [
  body('subjectId').isMongoId().withMessage('Valid subjectId is required'),
  body('topicId').optional().isMongoId().withMessage('topicId must be valid'),
  body('quizScore').optional().isInt({ min: 0, max: 100 }).withMessage('quizScore must be 0-100'),
  body('confidenceScore').optional().isInt({ min: 1, max: 5 }).withMessage('confidenceScore must be 1-5'),
  body('actionType').optional().isIn(['check_in', 'quiz_attempt', 'revision_completed']).withMessage('Invalid actionType'),
];

const subjectIdParamValidator = [
  param('subjectId').isMongoId().withMessage('Valid subjectId parameter is required'),
];

module.exports = {
  updateMasteryValidators,
  subjectIdParamValidator,
};
