const asyncHandler = require('../../middlewares/asyncHandler');
const { sendResponse } = require('../../utils/response');
const checkinsService = require('./checkins.service');

const createCheckInController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const result = await checkinsService.createCheckIn({ userId, data: req.body });

  return sendResponse(res, {
    success: true,
    message: 'Daily check-in logged and analyzed successfully',
    data: result,
    errors: [],
  }, 201);
});

const getTodayCheckInController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const checkIn = await checkinsService.getTodayCheckIn(userId);

  return sendResponse(res, {
    success: true,
    message: "Today's check-in status retrieved",
    data: { checkIn },
    errors: [],
  });
});

const getHistoryController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const history = await checkinsService.getHistory(userId);

  return sendResponse(res, {
    success: true,
    message: 'Check-in history retrieved successfully',
    data: { history },
    errors: [],
  });
});

const getStreakController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const streak = await checkinsService.getStreak(userId);

  return sendResponse(res, {
    success: true,
    message: 'Streaks retrieved successfully',
    data: { streak },
    errors: [],
  });
});

const getAnalyticsController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const analytics = await checkinsService.getAnalytics(userId);

  return sendResponse(res, {
    success: true,
    message: 'Check-in analytics processed successfully',
    data: { analytics },
    errors: [],
  });
});

module.exports = {
  createCheckInController,
  getTodayCheckInController,
  getHistoryController,
  getStreakController,
  getAnalyticsController,
};
