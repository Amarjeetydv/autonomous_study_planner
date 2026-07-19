const asyncHandler = require('../../middlewares/asyncHandler');
const { sendResponse } = require('../../utils/response');
const schedulerService = require('./scheduler.service');

const recalculateController = asyncHandler(async (req, res) => {
  const studentId = req.user._id || req.user.id;
  const triggerEvent = req.body.triggerEvent || 'manual';

  const preview = await schedulerService.recalculateSchedule({ 
    studentId, 
    triggerEvent 
  });

  return sendResponse(res, {
    success: true,
    message: 'Recalculation complete. Preview generated.',
    data: { preview },
    errors: [],
  }, 201);
});

const getPreviewController = asyncHandler(async (req, res) => {
  const studentId = req.user._id || req.user.id;
  const preview = await schedulerService.getActivePreview(studentId);

  return sendResponse(res, {
    success: true,
    message: 'Active preview retrieved successfully',
    data: { preview },
    errors: [],
  });
});

const applyController = asyncHandler(async (req, res) => {
  const studentId = req.user._id || req.user.id;
  const log = await schedulerService.applySchedule(studentId);

  return sendResponse(res, {
    success: true,
    message: 'Recalculated schedule applied successfully',
    data: { log },
    errors: [],
  });
});

const rejectController = asyncHandler(async (req, res) => {
  const studentId = req.user._id || req.user.id;
  const log = await schedulerService.rejectSchedule(studentId);

  return sendResponse(res, {
    success: true,
    message: 'Recalculation preview rejected',
    data: { log },
    errors: [],
  });
});

const getHistoryController = asyncHandler(async (req, res) => {
  const studentId = req.user._id || req.user.id;
  const history = await schedulerService.getHistory(studentId);

  return sendResponse(res, {
    success: true,
    message: 'Rescheduling history retrieved successfully',
    data: { history },
    errors: [],
  });
});

module.exports = {
  recalculateController,
  getPreviewController,
  applyController,
  rejectController,
  getHistoryController,
};
