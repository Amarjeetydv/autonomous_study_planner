const express = require('express');
const { protect, authorizeRoles } = require('../auth/auth.middleware');
const validateRequest = require('../../middlewares/validateRequest.middleware');
const {
  getDashboardStatsController,
  listUsersController,
  updateUserStatusController,
  deleteUserAccountController,
  listCurriculumController,
  createSubjectController,
  updateSubjectController,
  deleteSubjectController,
  getAuditLogsController,
  getSystemHealthController,
} = require('./admin.controller');
const {
  curriculumSubjectValidators,
  updateUserValidators,
  mongoIdParamValidator,
} = require('./admin.validators');

const router = express.Router();

const adminAccess = [protect, authorizeRoles('Admin')];

router.get('/dashboard', ...adminAccess, getDashboardStatsController);
router.get('/users', ...adminAccess, listUsersController);
router.patch('/users/:id', ...adminAccess, mongoIdParamValidator, updateUserValidators, validateRequest, updateUserStatusController);
router.delete('/users/:id', ...adminAccess, mongoIdParamValidator, validateRequest, deleteUserAccountController);

router.get('/curriculum', ...adminAccess, listCurriculumController);
router.post('/curriculum', ...adminAccess, curriculumSubjectValidators, validateRequest, createSubjectController);
router.put('/curriculum/:id', ...adminAccess, mongoIdParamValidator, curriculumSubjectValidators, validateRequest, updateSubjectController);
router.delete('/curriculum/:id', ...adminAccess, mongoIdParamValidator, validateRequest, deleteSubjectController);

router.get('/system-health', ...adminAccess, getSystemHealthController);
router.get('/audit-logs', ...adminAccess, getAuditLogsController);

module.exports = router;
