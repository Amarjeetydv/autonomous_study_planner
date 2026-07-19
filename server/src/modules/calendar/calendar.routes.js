const express = require('express');
const { protect, authorizeRoles } = require('../auth/auth.middleware');
const validateRequest = require('../../middlewares/validateRequest.middleware');
const {
  listEventsController,
  createCustomEventController,
  updateEventController,
  deleteEventController,
  googleCalendarSyncController,
} = require('./calendar.controller');
const {
  createEventValidators,
  updateEventValidators,
  eventIdParamValidator,
} = require('./calendar.validators');

const router = express.Router();

const calendarAccess = [protect, authorizeRoles('Student', 'Admin')];

router.get('/', ...calendarAccess, listEventsController);
router.post('/', ...calendarAccess, createEventValidators, validateRequest, createCustomEventController);
router.put('/:eventId', ...calendarAccess, eventIdParamValidator, updateEventValidators, validateRequest, updateEventController);
router.delete('/:eventId', ...calendarAccess, eventIdParamValidator, validateRequest, deleteEventController);
router.post('/sync/google', ...calendarAccess, googleCalendarSyncController);

module.exports = router;
