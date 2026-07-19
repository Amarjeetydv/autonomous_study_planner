const { body, query } = require('express-validator');
const { AUTH_ROLES } = require('./auth.constants');

const passwordRules = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
];

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  ...passwordRules,
  body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match'),
  body('role')
    .optional()
    .isIn([AUTH_ROLES.STUDENT, AUTH_ROLES.MENTOR])
    .withMessage('Role must be Student or Mentor'),
];

const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidator = [body('email').isEmail().withMessage('Valid email is required').normalizeEmail()];

const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  ...passwordRules,
  body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match'),
];

const verifyEmailValidator = [
  body('token').optional().notEmpty().withMessage('Verification token is required'),
  query('token').optional().notEmpty().withMessage('Verification token is required'),
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  ...passwordRules,
  body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match'),
];

const resendVerificationValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
];

module.exports = {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  verifyEmailValidator,
  changePasswordValidator,
  resendVerificationValidator,
};
