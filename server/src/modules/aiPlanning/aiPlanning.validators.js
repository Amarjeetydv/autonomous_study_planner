const { body, param, query } = require('express-validator');

const generatePlanValidators = [
  body('goalId').isMongoId().withMessage('Valid goalId is required'),
  body('stream').optional().isBoolean().withMessage('stream must be a boolean'),
  body('includeProgress').optional().isBoolean().withMessage('includeProgress must be a boolean'),
  body('temperature').optional().isFloat({ min: 0, max: 1 }).withMessage('temperature must be between 0 and 1'),
  body('model').optional().isString().trim().notEmpty().withMessage('model must be a non-empty string'),
  body('promptVersion').optional().isString().trim().notEmpty().withMessage('promptVersion must be a non-empty string'),
];

const listPlanValidators = [
  query('studentId').optional().isMongoId().withMessage('studentId must be valid'),
  query('goalId').optional().isMongoId().withMessage('goalId must be valid'),
  query('status').optional().isIn(['draft', 'generated', 'validated', 'rejected', 'archived']).withMessage('Invalid plan status'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
];

const planIdParamValidator = [param('planId').isMongoId().withMessage('Valid planId is required')];
const jobIdParamValidator = [param('jobId').isMongoId().withMessage('Valid jobId is required')];

module.exports = {
  generatePlanValidators,
  listPlanValidators,
  planIdParamValidator,
  jobIdParamValidator,
};
