const express = require('express');
const { protect, authorizeRoles } = require('../auth/auth.middleware');
const validateRequest = require('../../middlewares/validateRequest.middleware');
const {
  updateMasteryController,
  listMasteriesController,
  getSubjectMasteryController,
  getWeakTopicsController,
  getRevisionQueueController,
} = require('./mastery.controller');
const {
  updateMasteryValidators,
  subjectIdParamValidator,
} = require('./mastery.validators');

const router = express.Router();

const masteryAccess = [protect, authorizeRoles('Student', 'Admin')];

router.post('/update', ...masteryAccess, updateMasteryValidators, validateRequest, updateMasteryController);
router.get('/', ...masteryAccess, listMasteriesController);
router.get('/subject/:subjectId', ...masteryAccess, subjectIdParamValidator, validateRequest, getSubjectMasteryController);
router.get('/weak-topics', ...masteryAccess, getWeakTopicsController);
router.get('/revision-queue', ...masteryAccess, getRevisionQueueController);

module.exports = router;
