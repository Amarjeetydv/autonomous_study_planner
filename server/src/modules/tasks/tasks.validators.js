const { body, param, query } = require('express-validator');

const createTaskValidators = [
  body('goalId').isMongoId().withMessage('Valid goalId is required'),
  body('title').isString().trim().notEmpty().withMessage('title is required'),
  body('taskType').isIn(['Study', 'Revision', 'Mock Test', 'Practice']).withMessage('Invalid taskType'),
  body('scheduledDate').isISO8601().withMessage('Valid scheduledDate is required'),
  body('estimatedDuration').optional().isInt({ min: 0 }).withMessage('estimatedDuration must be positive'),
  body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority level'),
  body('difficulty').optional().isIn(['Beginner', 'Intermediate', 'Advanced', 'Mixed']).withMessage('Invalid difficulty level'),
];

const updateTaskValidators = [
  body('title').optional().isString().trim().notEmpty().withMessage('title cannot be empty'),
  body('taskType').optional().isIn(['Study', 'Revision', 'Mock Test', 'Practice']).withMessage('Invalid taskType'),
  body('status').optional().isIn(['Pending', 'In Progress', 'Completed', 'Missed', 'Skipped']).withMessage('Invalid status'),
  body('completionPercentage').optional().isInt({ min: 0, max: 100 }).withMessage('completionPercentage must be between 0 and 100'),
  body('actualStudyTime').optional().isInt({ min: 0 }).withMessage('actualStudyTime must be positive'),
];

const listTasksQueryValidators = [
  query('status').optional().isIn(['Pending', 'In Progress', 'Completed', 'Missed', 'Skipped']).withMessage('Invalid status query'),
  query('taskType').optional().isIn(['Study', 'Revision', 'Mock Test', 'Practice']).withMessage('Invalid taskType query'),
  query('goalId').optional().isMongoId().withMessage('goalId must be valid'),
];

const taskIdParamValidator = [
  param('taskId').isMongoId().withMessage('Valid taskId parameter is required'),
];

module.exports = {
  createTaskValidators,
  updateTaskValidators,
  listTasksQueryValidators,
  taskIdParamValidator,
};
