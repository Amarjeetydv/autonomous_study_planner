const { body, param, query } = require('express-validator');
const { GOAL_TYPES, CURRENT_LEVELS, PREFERRED_STUDY_TIMES, DIFFICULTY_PREFERENCES, LEARNING_STYLES, REMINDER_MODES, REMINDER_FREQUENCIES } = require('./goals.constants');

const listQueryValidators = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  query('status').optional().isIn(['active', 'paused', 'completed', 'archived']).withMessage('Invalid goal status'),
  query('goalType').optional().isIn(GOAL_TYPES).withMessage('Invalid goal type'),
  query('currentLevel').optional().isIn(CURRENT_LEVELS).withMessage('Invalid current level'),
  query('from').optional().isISO8601().withMessage('from must be a valid date'),
  query('to').optional().isISO8601().withMessage('to must be a valid date'),
];

const subjectArrayValidator = (fieldName) =>
  body(fieldName)
    .optional({ nullable: true })
    .isArray({ min: 0 })
    .withMessage(`${fieldName} must be an array of subject IDs`);

const subjectItemValidators = (fieldName) => [body(`${fieldName}.*`).optional().isMongoId().withMessage(`${fieldName} entries must be valid subject IDs`)];

const baseGoalValidators = [
  body('title').trim().notEmpty().withMessage('Goal title is required'),
  body('goalType').trim().notEmpty().isIn(GOAL_TYPES).withMessage('Invalid goal type'),
  body('targetDate').isISO8601().withMessage('Target date must be a valid date'),
  body('currentLevel').trim().notEmpty().isIn(CURRENT_LEVELS).withMessage('Invalid current level'),
  body('dailyStudyHours').isFloat({ min: 0, max: 24 }).withMessage('Daily study hours must be between 0 and 24'),
  body('weeklyStudyDays').isInt({ min: 1, max: 7 }).withMessage('Weekly study days must be between 1 and 7'),
  body('preferredStudyTime').trim().notEmpty().isIn(PREFERRED_STUDY_TIMES).withMessage('Invalid preferred study time'),
  body('preferredSessionLengthMinutes').isInt({ min: 15, max: 480 }).withMessage('Preferred session length must be between 15 and 480 minutes'),
  body('difficultyPreference').trim().notEmpty().isIn(DIFFICULTY_PREFERENCES).withMessage('Invalid difficulty preference'),
  body('learningStyle').trim().notEmpty().isIn(LEARNING_STYLES).withMessage('Invalid learning style'),
  body('targetScore').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Target score must be a positive number'),
  body('motivation').optional().isString().withMessage('Motivation must be a string'),
  body('timezone').trim().notEmpty().isString().withMessage('Timezone is required'),
  body('language').trim().notEmpty().isString().withMessage('Language is required'),
  body('reminderPreference.isEnabled').optional().isBoolean().withMessage('Reminder preference isEnabled must be a boolean'),
  body('reminderPreference.mode').optional().isIn(REMINDER_MODES).withMessage('Invalid reminder mode'),
  body('reminderPreference.reminderTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Reminder time must be in HH:mm format'),
  body('reminderPreference.frequency').optional().isIn(REMINDER_FREQUENCIES).withMessage('Invalid reminder frequency'),
  body('calendarPreference.isEnabled').optional().isBoolean().withMessage('Calendar preference isEnabled must be a boolean'),
  body('calendarPreference.includeWeekends').optional().isBoolean().withMessage('includeWeekends must be a boolean'),
  body('calendarPreference.includeBreakDays').optional().isBoolean().withMessage('includeBreakDays must be a boolean'),
  body('calendarPreference.color')
    .optional()
    .matches(/^#([0-9A-Fa-f]{3}){1,2}$/)
    .withMessage('Calendar color must be a valid hex color'),
  body('breakDays').optional({ nullable: true }).isArray().withMessage('breakDays must be an array of strings'),
  body('breakDays.*').optional().isString().trim(),
  body('vacationDays').optional({ nullable: true }).isArray().withMessage('vacationDays must be an array'),
  body('vacationDays.*.startDate').optional().isISO8601().withMessage('Vacation startDate must be valid'),
  body('vacationDays.*.endDate').optional().isISO8601().withMessage('Vacation endDate must be valid'),
  body('strongSubjects').optional({ nullable: true }).isArray().withMessage('strongSubjects must be an array'),
  body('weakSubjects').optional({ nullable: true }).isArray().withMessage('weakSubjects must be an array'),
  body('selectedSubjects').isArray({ min: 1 }).withMessage('selectedSubjects must include at least one subject'),
  body('prioritySubjects').optional({ nullable: true }).isArray().withMessage('prioritySubjects must be an array'),
  ...subjectItemValidators('strongSubjects'),
  ...subjectItemValidators('weakSubjects'),
  ...subjectItemValidators('prioritySubjects'),
];

const createGoalValidators = [...baseGoalValidators];

const updateGoalValidators = [
  body('title').optional().trim().notEmpty().withMessage('Goal title is required'),
  body('goalType').optional().trim().notEmpty().isIn(GOAL_TYPES).withMessage('Invalid goal type'),
  body('targetDate').optional().isISO8601().withMessage('Target date must be a valid date'),
  body('currentLevel').optional().trim().notEmpty().isIn(CURRENT_LEVELS).withMessage('Invalid current level'),
  body('dailyStudyHours').optional().isFloat({ min: 0, max: 24 }).withMessage('Daily study hours must be between 0 and 24'),
  body('weeklyStudyDays').optional().isInt({ min: 1, max: 7 }).withMessage('Weekly study days must be between 1 and 7'),
  body('preferredStudyTime').optional().trim().notEmpty().isIn(PREFERRED_STUDY_TIMES).withMessage('Invalid preferred study time'),
  body('preferredSessionLengthMinutes').optional().isInt({ min: 15, max: 480 }).withMessage('Preferred session length must be between 15 and 480 minutes'),
  body('difficultyPreference').optional().trim().notEmpty().isIn(DIFFICULTY_PREFERENCES).withMessage('Invalid difficulty preference'),
  body('learningStyle').optional().trim().notEmpty().isIn(LEARNING_STYLES).withMessage('Invalid learning style'),
  body('targetScore').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Target score must be a positive number'),
  body('motivation').optional().isString().withMessage('Motivation must be a string'),
  body('timezone').optional().trim().notEmpty().isString().withMessage('Timezone is required'),
  body('language').optional().trim().notEmpty().isString().withMessage('Language is required'),
  body('reminderPreference.isEnabled').optional().isBoolean().withMessage('Reminder preference isEnabled must be a boolean'),
  body('reminderPreference.mode').optional().isIn(REMINDER_MODES).withMessage('Invalid reminder mode'),
  body('reminderPreference.reminderTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Reminder time must be in HH:mm format'),
  body('reminderPreference.frequency').optional().isIn(REMINDER_FREQUENCIES).withMessage('Invalid reminder frequency'),
  body('calendarPreference.isEnabled').optional().isBoolean().withMessage('Calendar preference isEnabled must be a boolean'),
  body('calendarPreference.includeWeekends').optional().isBoolean().withMessage('includeWeekends must be a boolean'),
  body('calendarPreference.includeBreakDays').optional().isBoolean().withMessage('includeBreakDays must be a boolean'),
  body('calendarPreference.color')
    .optional()
    .matches(/^#([0-9A-Fa-f]{3}){1,2}$/)
    .withMessage('Calendar color must be a valid hex color'),
  body('breakDays').optional({ nullable: true }).isArray().withMessage('breakDays must be an array of strings'),
  body('breakDays.*').optional().isString().trim(),
  body('vacationDays').optional({ nullable: true }).isArray().withMessage('vacationDays must be an array'),
  body('vacationDays.*.startDate').optional().isISO8601().withMessage('Vacation startDate must be valid'),
  body('vacationDays.*.endDate').optional().isISO8601().withMessage('Vacation endDate must be valid'),
  subjectArrayValidator('strongSubjects'),
  subjectArrayValidator('weakSubjects'),
  body('selectedSubjects').optional().isArray({ min: 1 }).withMessage('selectedSubjects must include at least one subject'),
  subjectArrayValidator('prioritySubjects'),
  ...subjectItemValidators('strongSubjects'),
  ...subjectItemValidators('weakSubjects'),
  ...subjectItemValidators('prioritySubjects'),
  body('status').not().exists().withMessage('Use dedicated goal action endpoints to change status'),
];

const duplicateGoalValidator = [body('title').optional().isString().withMessage('Title must be a string')];

const goalIdParamValidator = [param('goalId').isMongoId().withMessage('Valid goalId is required')];

module.exports = {
  listQueryValidators,
  createGoalValidators,
  updateGoalValidators,
  duplicateGoalValidator,
  goalIdParamValidator,
};
