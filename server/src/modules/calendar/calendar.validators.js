const { body, param } = require('express-validator');

const createEventValidators = [
  body('title').isString().notEmpty().withMessage('Event title is required'),
  body('startDateTime').isISO8601().withMessage('Valid start date time is required'),
  body('endDateTime').isISO8601().withMessage('Valid end date time is required'),
  body('eventType').optional().isIn(['studyBlock', 'deadline', 'mentorSession', 'quiz', 'reminder', 'custom']).withMessage('Invalid eventType'),
  body('status').optional().isIn(['scheduled', 'completed', 'cancelled', 'moved']).withMessage('Invalid status'),
];

const updateEventValidators = [
  body('title').optional().isString().notEmpty().withMessage('Event title must be valid string'),
  body('startDateTime').optional().isISO8601().withMessage('Valid start date time is required'),
  body('endDateTime').optional().isISO8601().withMessage('Valid end date time is required'),
  body('eventType').optional().isIn(['studyBlock', 'deadline', 'mentorSession', 'quiz', 'reminder', 'custom']).withMessage('Invalid eventType'),
  body('status').optional().isIn(['scheduled', 'completed', 'cancelled', 'moved']).withMessage('Invalid status'),
];

const eventIdParamValidator = [
  param('eventId').isMongoId().withMessage('Valid eventId parameter is required'),
];

module.exports = {
  createEventValidators,
  updateEventValidators,
  eventIdParamValidator,
};
