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

const rescheduleSkippedController = asyncHandler(async (req, res) => {
  const studentId = req.user._id || req.user.id;
  const { taskId } = req.body;
  const DailyTask = require('../../models/DailyTask');
  
  const task = await DailyTask.findById(taskId);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  task.status = 'Skipped';
  await task.save();

  const options = await schedulerService.findNextAvailableSlotsForTask(task, studentId);

  return sendResponse(res, {
    success: true,
    message: 'Task skipped. Suggested reschedule slots calculated.',
    data: {
      taskId,
      options
    },
    errors: []
  });
});

const acceptRescheduleController = asyncHandler(async (req, res) => {
  const studentId = req.user._id || req.user.id;
  const { taskId, slot } = req.body;
  const DailyTask = require('../../models/DailyTask');

  const task = await DailyTask.findById(taskId);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  task.scheduledDate = new Date(slot.plannedDate);
  task.plannedDate = new Date(slot.plannedDate);
  task.plannedStartTime = slot.plannedStartTime;
  task.plannedEndTime = slot.plannedEndTime;
  task.status = 'Pending';
  task.isRescheduled = true;

  await task.save();

  const CalendarEvent = require('../../models/CalendarEvent');
  await CalendarEvent.findOneAndUpdate(
    { sourceId: task._id },
    {
      $set: {
        startDateTime: new Date(slot.plannedDate),
        endDateTime: new Date(slot.plannedDate),
        status: 'moved'
      }
    }
  );

  return sendResponse(res, {
    success: true,
    message: 'Task successfully rescheduled.',
    data: { task },
    errors: []
  });
});

module.exports = {
  recalculateController,
  getPreviewController,
  applyController,
  rejectController,
  getHistoryController,
  rescheduleSkippedController,
  acceptRescheduleController,
};
