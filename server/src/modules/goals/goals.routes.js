const express = require('express');
const { protect, authorizeRoles } = require('../../modules/auth/auth.middleware');
const validateRequest = require('../../middlewares/validateRequest.middleware');
const {
  listGoalsController,
  createGoalController,
  getGoalController,
  updateGoalController,
  deleteGoalController,
  pauseGoalController,
  resumeGoalController,
  archiveGoalController,
  completeGoalController,
  duplicateGoalController,
} = require('./goals.controller');
const { listQueryValidators, createGoalValidators, updateGoalValidators, duplicateGoalValidator, goalIdParamValidator } = require('./goals.validators');

const router = express.Router();

const authenticatedViewer = [protect, authorizeRoles('Student', 'Mentor', 'Admin')];
const studentWriter = [protect, authorizeRoles('Student', 'Admin')];

router.get('/', ...authenticatedViewer, listQueryValidators, validateRequest, listGoalsController);
router.post('/', ...studentWriter, createGoalValidators, validateRequest, createGoalController);
router.get('/:goalId', ...authenticatedViewer, goalIdParamValidator, validateRequest, getGoalController);
router.patch('/:goalId', ...studentWriter, goalIdParamValidator, updateGoalValidators, validateRequest, updateGoalController);
router.delete('/:goalId', ...studentWriter, goalIdParamValidator, validateRequest, deleteGoalController);
router.post('/:goalId/pause', ...studentWriter, goalIdParamValidator, validateRequest, pauseGoalController);
router.post('/:goalId/resume', ...studentWriter, goalIdParamValidator, validateRequest, resumeGoalController);
router.post('/:goalId/archive', ...studentWriter, goalIdParamValidator, validateRequest, archiveGoalController);
router.put('/:goalId/archive', ...studentWriter, goalIdParamValidator, validateRequest, archiveGoalController);
router.post('/:goalId/complete', ...studentWriter, goalIdParamValidator, validateRequest, completeGoalController);
router.post('/:goalId/duplicate', ...studentWriter, goalIdParamValidator, duplicateGoalValidator, validateRequest, duplicateGoalController);

module.exports = router;
