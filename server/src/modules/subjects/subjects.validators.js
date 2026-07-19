const { body, param, query } = require('express-validator');
const { SUBJECT_DIFFICULTIES, RECOMMENDATION_TARGET_TYPES } = require('./subjects.constants');

const listQueryValidators = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
];

const subjectCreateValidators = [
  body('name').trim().notEmpty().withMessage('Subject name is required'),
  body('code')
    .trim()
    .notEmpty()
    .matches(/^[A-Z0-9_-]+$/i)
    .withMessage('Subject code may contain letters, numbers, underscores, and dashes only'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('difficulty').trim().notEmpty().isIn(SUBJECT_DIFFICULTIES).withMessage('Invalid difficulty value'),
  body('color')
    .optional()
    .matches(/^#([0-9A-Fa-f]{3}){1,2}$/)
    .withMessage('Color must be a valid hex code'),
  body('icon').optional().isString().withMessage('Icon must be a string'),
  body('estimatedHours').optional().isFloat({ min: 0 }).withMessage('Estimated hours must be a positive number'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

const subjectUpdateValidators = [
  body('name').optional().trim().notEmpty().withMessage('Subject name is required'),
  body('code')
    .optional()
    .trim()
    .notEmpty()
    .matches(/^[A-Z0-9_-]+$/i)
    .withMessage('Subject code may contain letters, numbers, underscores, and dashes only'),
  body('category').optional().trim().notEmpty().withMessage('Category is required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('difficulty').optional().trim().notEmpty().isIn(SUBJECT_DIFFICULTIES).withMessage('Invalid difficulty value'),
  body('color')
    .optional()
    .matches(/^#([0-9A-Fa-f]{3}){1,2}$/)
    .withMessage('Color must be a valid hex code'),
  body('icon').optional().isString().withMessage('Icon must be a string'),
  body('estimatedHours').optional().isFloat({ min: 0 }).withMessage('Estimated hours must be a positive number'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

const topicCreateValidators = [
  body('name').trim().notEmpty().withMessage('Topic name is required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('order').optional().isInt({ min: 1 }).withMessage('Order must be a positive integer'),
  body('difficulty').trim().notEmpty().isIn(SUBJECT_DIFFICULTIES).withMessage('Invalid difficulty value'),
  body('estimatedTimeMinutes')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Estimated time must be a non-negative integer'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

const topicUpdateValidators = [
  body('name').optional().trim().notEmpty().withMessage('Topic name is required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('order').optional().isInt({ min: 1 }).withMessage('Order must be a positive integer'),
  body('difficulty').optional().trim().notEmpty().isIn(SUBJECT_DIFFICULTIES).withMessage('Invalid difficulty value'),
  body('estimatedTimeMinutes')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Estimated time must be a non-negative integer'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

const subtopicCreateValidators = [
  body('name').trim().notEmpty().withMessage('Subtopic name is required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('learningObjective').optional().isString().withMessage('Learning objective must be a string'),
  body('order').optional().isInt({ min: 1 }).withMessage('Order must be a positive integer'),
  body('estimatedTimeMinutes')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Estimated time must be a non-negative integer'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

const subtopicUpdateValidators = [
  body('name').optional().trim().notEmpty().withMessage('Subtopic name is required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('learningObjective').optional().isString().withMessage('Learning objective must be a string'),
  body('order').optional().isInt({ min: 1 }).withMessage('Order must be a positive integer'),
  body('estimatedTimeMinutes')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Estimated time must be a non-negative integer'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

const recommendationBodyValidators = [
  body('note').optional().isString().withMessage('Note must be a string'),
  body('targetType')
    .optional()
    .isIn([RECOMMENDATION_TARGET_TYPES.SUBJECT, RECOMMENDATION_TARGET_TYPES.TOPIC])
    .withMessage('Invalid recommendation target type'),
];

const subjectIdParamValidator = [param('subjectId').isMongoId().withMessage('Valid subjectId is required')];
const topicIdParamValidator = [param('topicId').isMongoId().withMessage('Valid topicId is required')];
const subtopicIdParamValidator = [param('subtopicId').isMongoId().withMessage('Valid subtopicId is required')];

const progressQueryValidators = [
  query('subjectId').optional().isMongoId().withMessage('subjectId must be valid'),
  query('completed').optional().isBoolean().withMessage('completed must be a boolean'),
  query('bookmarked').optional().isBoolean().withMessage('bookmarked must be a boolean'),
];

module.exports = {
  listQueryValidators,
  subjectCreateValidators,
  subjectUpdateValidators,
  topicCreateValidators,
  topicUpdateValidators,
  subtopicCreateValidators,
  subtopicUpdateValidators,
  recommendationBodyValidators,
  subjectIdParamValidator,
  topicIdParamValidator,
  subtopicIdParamValidator,
  progressQueryValidators,
};
