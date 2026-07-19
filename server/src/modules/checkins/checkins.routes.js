const express = require('express');
const { protect, authorizeRoles } = require('../auth/auth.middleware');
const validateRequest = require('../../middlewares/validateRequest.middleware');
const {
  createCheckInController,
  getTodayCheckInController,
  getHistoryController,
  getStreakController,
  getAnalyticsController,
} = require('./checkins.controller');
const { createCheckInValidators } = require('./checkins.validators');

const router = express.Router();

const checkinAccess = [protect, authorizeRoles('Student', 'Admin')];

router.post('/', ...checkinAccess, createCheckInValidators, validateRequest, createCheckInController);
router.get('/today', ...checkinAccess, getTodayCheckInController);
router.get('/history', ...checkinAccess, getHistoryController);
router.get('/streak', ...checkinAccess, getStreakController);
router.get('/analytics', ...checkinAccess, getAnalyticsController);

module.exports = router;
