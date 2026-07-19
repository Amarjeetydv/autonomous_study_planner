const asyncHandler = require('../../middlewares/asyncHandler');
const { sendResponse } = require('../../utils/response');
const masteryService = require('./mastery.service');

const updateMasteryController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const mastery = await masteryService.updateMastery({ userId, data: req.body });

  return sendResponse(res, {
    success: true,
    message: 'Mastery score updated successfully',
    data: { mastery },
    errors: [],
  });
});

const listMasteriesController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const masteries = await masteryService.listMasteries(userId);

  return sendResponse(res, {
    success: true,
    message: 'Knowledge mastery list retrieved successfully',
    data: { masteries },
    errors: [],
  });
});

const getSubjectMasteryController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const masteries = await masteryService.getSubjectMastery(userId, req.params.subjectId);

  return sendResponse(res, {
    success: true,
    message: 'Subject mastery detail processed successfully',
    data: { masteries },
    errors: [],
  });
});

const getWeakTopicsController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const weakTopics = await masteryService.getWeakTopics(userId);

  return sendResponse(res, {
    success: true,
    message: 'Weak topics identified successfully',
    data: { weakTopics },
    errors: [],
  });
});

const getRevisionQueueController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const queue = await masteryService.getRevisionQueue(userId);

  return sendResponse(res, {
    success: true,
    message: 'Spaced revision queue processed successfully',
    data: { queue },
    errors: [],
  });
});

module.exports = {
  updateMasteryController,
  listMasteriesController,
  getSubjectMasteryController,
  getWeakTopicsController,
  getRevisionQueueController,
};
