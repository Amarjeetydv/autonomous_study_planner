const asyncHandler = require('../../middlewares/asyncHandler');
const { sendResponse } = require('../../utils/response');
const gamificationService = require('./gamification.service');

const listAchievementsController = asyncHandler(async (req, res) => {
  const achievements = await gamificationService.listAllAchievements();

  return sendResponse(res, {
    success: true,
    message: 'Master achievements list retrieved successfully',
    data: { achievements },
    errors: [],
  });
});

const listUserAchievementsController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const achievements = await gamificationService.listUserAchievements(userId);

  return sendResponse(res, {
    success: true,
    message: 'User unlocked achievements retrieved successfully',
    data: { achievements },
    errors: [],
  });
});

const getUserLevelController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const level = await gamificationService.getUserLevel(userId);

  return sendResponse(res, {
    success: true,
    message: 'User level and XP statistics retrieved successfully',
    data: { level },
    errors: [],
  });
});

const recalculateLevelController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const level = await gamificationService.recalculateLevel(userId);

  return sendResponse(res, {
    success: true,
    message: 'User Level parameters recalculated successfully based on historical performance logs',
    data: { level },
    errors: [],
  });
});

module.exports = {
  listAchievementsController,
  listUserAchievementsController,
  getUserLevelController,
  recalculateLevelController,
};
