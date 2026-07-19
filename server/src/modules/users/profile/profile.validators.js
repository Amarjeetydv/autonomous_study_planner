const { body, param } = require('express-validator');
const {
  GENDERS,
  LEARNING_STYLES,
  PREFERRED_STUDY_TIMES,
  THEME_OPTIONS,
  LANGUAGE_OPTIONS,
  PROFILE_VISIBILITY,
} = require('./profile.constants');

const optionalString = (field) => body(field).optional({ nullable: true, checkFalsy: true }).isString().trim();

const updateProfileValidator = [
  optionalString('fullName').isLength({ min: 2 }).withMessage('Full name must be at least 2 characters long'),
  optionalString('phoneNumber').isLength({ min: 7, max: 20 }).withMessage('Phone number must be between 7 and 20 characters'),
  body('dateOfBirth')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),
  body('gender')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(GENDERS)
    .withMessage('Invalid gender value'),
  optionalString('education'),
  optionalString('college'),
  optionalString('university'),
  body('skills').optional({ nullable: true }).isArray().withMessage('Skills must be an array of strings'),
  body('skills.*').optional().isString().trim(),
  body('interests').optional({ nullable: true }).isArray().withMessage('Interests must be an array of strings'),
  body('interests.*').optional().isString().trim(),
  body('learningStyle')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(LEARNING_STYLES)
    .withMessage('Invalid learning style value'),
  body('preferredStudyTime')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(PREFERRED_STUDY_TIMES)
    .withMessage('Invalid preferred study time value'),
  optionalString('timeZone'),
  body('dailyStudyHours')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0, max: 24 })
    .withMessage('Daily study hours must be between 0 and 24'),
  optionalString('bio').isLength({ max: 1000 }).withMessage('Bio must not exceed 1000 characters'),
  body('profileVisibility')
    .optional({ nullable: true, checkFalsy: true })
    .isIn([PROFILE_VISIBILITY.PUBLIC, PROFILE_VISIBILITY.PRIVATE])
    .withMessage('Invalid profile visibility value'),
];

const updateSettingsValidator = [
  body('emailNotifications').optional().isBoolean().withMessage('Email notifications must be a boolean'),
  body('pushNotifications').optional().isBoolean().withMessage('Push notifications must be a boolean'),
  body('reminderTime')
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Reminder time must be in HH:mm format'),
  body('theme')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(THEME_OPTIONS)
    .withMessage('Invalid theme value'),
  body('language')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(LANGUAGE_OPTIONS)
    .withMessage('Invalid language value'),
];

const profileUserIdValidator = [param('userId').isMongoId().withMessage('Valid userId is required')];

module.exports = {
  updateProfileValidator,
  updateSettingsValidator,
  profileUserIdValidator,
};
