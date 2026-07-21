const { body, param } = require('express-validator');

const generateQuizValidators = [
  body('subjectId').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Valid subjectId parameter must be a MongoId'),
  body('topicId').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('topicId must be valid'),
  body('difficulty').optional().isIn(['Easy', 'Medium', 'Hard']).withMessage('Invalid difficulty level'),
  body('count').optional().isInt({ min: 1, max: 20 }).withMessage('count must be between 1 and 20'),
];

const submitAttemptValidators = [
  body('answers').isArray().withMessage('Answers array is required'),
  body('answers.*.questionIndex').isInt({ min: 0 }).withMessage('questionIndex must be a non-negative integer'),
  body('answers.*.answer').exists().withMessage('Answer text or index choice is required'),
  body('completionTime').isInt({ min: 0 }).withMessage('completionTime in seconds is required'),
];

const quizIdParamValidator = [
  param('quizId').isMongoId().withMessage('Valid quizId parameter is required'),
];

const attemptIdParamValidator = [
  param('attemptId').isMongoId().withMessage('Valid attemptId parameter is required'),
];

module.exports = {
  generateQuizValidators,
  submitAttemptValidators,
  quizIdParamValidator,
  attemptIdParamValidator,
};
