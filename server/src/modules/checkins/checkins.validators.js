const { body } = require('express-validator');

const createCheckInValidators = [
  body('mood').isIn(['Excellent', 'Good', 'Neutral', 'Stressed', 'Burnout']).withMessage('Valid mood is required'),
  body('energyLevel').isInt({ min: 1, max: 5 }).withMessage('energyLevel must be 1-5'),
  body('focusLevel').isInt({ min: 1, max: 5 }).withMessage('focusLevel must be 1-5'),
  body('confidenceLevel').isInt({ min: 1, max: 5 }).withMessage('confidenceLevel must be 1-5'),
  body('difficultyLevel').isInt({ min: 1, max: 5 }).withMessage('difficultyLevel must be 1-5'),
  body('productivityRating').isInt({ min: 1, max: 5 }).withMessage('productivityRating must be 1-5'),
  body('plannedStudyHours').isNumeric().withMessage('plannedStudyHours is required'),
  body('actualStudyHours').isNumeric().withMessage('actualStudyHours is required'),
  body('completedTasks').optional().isInt({ min: 0 }).withMessage('completedTasks must be non-negative'),
  body('missedTasks').optional().isInt({ min: 0 }).withMessage('missedTasks must be non-negative'),
  body('skippedTasks').optional().isInt({ min: 0 }).withMessage('skippedTasks must be non-negative'),
  body('blockers').optional().isArray().withMessage('blockers must be an array of strings'),
];

module.exports = {
  createCheckInValidators,
};
