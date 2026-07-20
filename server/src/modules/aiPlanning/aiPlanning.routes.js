const express = require('express');
const { protect, authorizeRoles } = require('../auth/auth.middleware');
const validateRequest = require('../../middlewares/validateRequest.middleware');
const { 
  generatePlanController, 
  getPlanController, 
  listPlansController, 
  deletePlanController,
  getJobController,
  getJobStatusController,
  getJobResultController,
  cancelJobController
} = require('./aiPlanning.controller');
const { subscribeToJobStreamController } = require('./sse.controller');
const { 
  generatePlanValidators, 
  listPlanValidators, 
  planIdParamValidator, 
  jobIdParamValidator 
} = require('./aiPlanning.validators');

const router = express.Router();

const aiPlanAccess = [protect, authorizeRoles('Student', 'Mentor', 'Admin')];
const aiPlanWriteAccess = [protect, authorizeRoles('Student', 'Admin', 'Mentor')];

router.get('/', ...aiPlanAccess, listPlanValidators, validateRequest, listPlansController);
router.get('/history', ...aiPlanAccess, listPlanValidators, validateRequest, listPlansController);
router.post('/generate', ...aiPlanWriteAccess, generatePlanValidators, validateRequest, generatePlanController);
router.get('/:planId', ...aiPlanAccess, planIdParamValidator, validateRequest, getPlanController);
router.delete('/:planId', ...aiPlanWriteAccess, planIdParamValidator, validateRequest, deletePlanController);

// Async Job endpoints
router.get('/job/:jobId', ...aiPlanAccess, jobIdParamValidator, validateRequest, getJobController);
router.get('/job/:jobId/status', ...aiPlanAccess, jobIdParamValidator, validateRequest, getJobStatusController);
router.get('/job/:jobId/stream', protect, jobIdParamValidator, validateRequest, subscribeToJobStreamController);
router.get('/job/:jobId/result', ...aiPlanAccess, jobIdParamValidator, validateRequest, getJobResultController);
router.delete('/job/:jobId', ...aiPlanWriteAccess, jobIdParamValidator, validateRequest, cancelJobController);

module.exports = router;
