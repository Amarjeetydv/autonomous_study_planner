const { body, param } = require('express-validator');

const curriculumSubjectValidators = [
  body('name').isString().notEmpty().withMessage('Subject name is required'),
  body('code').isString().notEmpty().withMessage('Subject code is required'),
  body('color').optional().isString().withMessage('Subject badge color must be string'),
];

const updateUserValidators = [
  body('role').optional().isIn(['Student', 'Mentor', 'Admin']).withMessage('Role must be Student, Mentor, or Admin'),
  body('status').optional().isIn(['active', 'suspended', 'pending']).withMessage('Status must be active, suspended, or pending'),
];

const mongoIdParamValidator = [
  param('id').isMongoId().withMessage('Valid document target ID is required'),
];

module.exports = {
  curriculumSubjectValidators,
  updateUserValidators,
  mongoIdParamValidator,
};
