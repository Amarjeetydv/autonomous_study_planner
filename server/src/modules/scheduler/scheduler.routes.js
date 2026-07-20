const express = require('express');
const { protect, authorizeRoles } = require('../auth/auth.middleware');
const validateRequest = require('../../middlewares/validateRequest.middleware');
const {
  recalculateController,
  getPreviewController,
  applyController,
  rejectController,
  getHistoryController,
  rescheduleSkippedController,
  acceptRescheduleController,
} = require('./scheduler.controller');

const router = express.Router();

const schedulerAccess = [protect, authorizeRoles('Student', 'Admin')];

router.post('/recalculate', ...schedulerAccess, recalculateController);
router.get('/preview', ...schedulerAccess, getPreviewController);
router.post('/apply', ...schedulerAccess, applyController);
router.post('/reject', ...schedulerAccess, rejectController);
router.get('/history', ...schedulerAccess, getHistoryController);
router.post('/reschedule-skipped', ...schedulerAccess, rescheduleSkippedController);
router.post('/accept-reschedule', ...schedulerAccess, acceptRescheduleController);

module.exports = router;
