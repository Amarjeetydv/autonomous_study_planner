const asyncHandler = require('../../middlewares/asyncHandler');
const { sendResponse } = require('../../utils/response');
const calendarService = require('./calendar.service');

const listEventsController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { start, end } = req.query;

  const events = await calendarService.listEvents({ userId, start, end });

  return sendResponse(res, {
    success: true,
    message: 'Calendar events list retrieved successfully',
    data: { events },
    errors: [],
  });
});

const createCustomEventController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const event = await calendarService.createCustomEvent({ userId, data: req.body });

  return sendResponse(res, {
    success: true,
    message: 'Custom calendar event created successfully',
    data: { event },
    errors: [],
  }, 201);
});

const updateEventController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const eventId = req.params.eventId;

  const event = await calendarService.updateEvent({ userId, eventId, data: req.body });

  return sendResponse(res, {
    success: true,
    message: 'Calendar event updated successfully',
    data: { event },
    errors: [],
  });
});

const deleteEventController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const eventId = req.params.eventId;

  await calendarService.deleteEvent({ userId, eventId });

  return sendResponse(res, {
    success: true,
    message: 'Calendar event deleted successfully',
    data: {},
    errors: [],
  });
});

const googleCalendarSyncController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const syncResults = await calendarService.googleCalendarSync(userId);

  return sendResponse(res, {
    success: true,
    message: 'Google Calendar sync completed successfully',
    data: { syncResults },
    errors: [],
  });
});

module.exports = {
  listEventsController,
  createCustomEventController,
  updateEventController,
  deleteEventController,
  googleCalendarSyncController,
};
