const asyncHandler = require('../../middlewares/asyncHandler');
const { sendResponse } = require('../../utils/response');
const tasksService = require('./tasks.service');

const createTaskController = asyncHandler(async (req, res) => {
  const studentId = req.user._id || req.user.id;
  const task = await tasksService.createTask({ studentId, data: req.body });

  return sendResponse(res, {
    success: true,
    message: 'Task created successfully',
    data: { task },
    errors: [],
  }, 201);
});

const listTasksController = asyncHandler(async (req, res) => {
  const studentId = req.user._id || req.user.id;
  const tasks = await tasksService.listTasks({ studentId, query: req.query });

  return sendResponse(res, {
    success: true,
    message: 'Tasks retrieved successfully',
    data: { tasks },
    errors: [],
  });
});

const getTodayTasksController = asyncHandler(async (req, res) => {
  const studentId = req.user._id || req.user.id;
  const tasks = await tasksService.getTodayTasks(studentId);

  return sendResponse(res, {
    success: true,
    message: "Today's tasks retrieved successfully",
    data: { tasks },
    errors: [],
  });
});

const getUpcomingTasksController = asyncHandler(async (req, res) => {
  const studentId = req.user._id || req.user.id;
  const tasks = await tasksService.getUpcomingTasks(studentId);

  return sendResponse(res, {
    success: true,
    message: 'Upcoming tasks retrieved successfully',
    data: { tasks },
    errors: [],
  });
});

const updateTaskController = asyncHandler(async (req, res) => {
  const studentId = req.user._id || req.user.id;
  const task = await tasksService.updateTask({ 
    taskId: req.params.taskId, 
    studentId, 
    data: req.body 
  });

  return sendResponse(res, {
    success: true,
    message: 'Task updated successfully',
    data: { task },
    errors: [],
  });
});

const deleteTaskController = asyncHandler(async (req, res) => {
  const studentId = req.user._id || req.user.id;
  await tasksService.deleteTask({ 
    taskId: req.params.taskId, 
    studentId 
  });

  return sendResponse(res, {
    success: true,
    message: 'Task deleted successfully',
    data: null,
    errors: [],
  });
});

const completeTaskController = asyncHandler(async (req, res) => {
  const studentId = req.user._id || req.user.id;
  const task = await tasksService.completeTask({
    taskId: req.params.taskId,
    studentId,
    actualStudyTime: req.body.actualStudyTime,
    notes: req.body.notes,
  });

  return sendResponse(res, {
    success: true,
    message: 'Task marked as completed',
    data: { task },
    errors: [],
  });
});

const skipTaskController = asyncHandler(async (req, res) => {
  const studentId = req.user._id || req.user.id;
  const task = await tasksService.skipTask({
    taskId: req.params.taskId,
    studentId,
    notes: req.body.notes,
  });

  return sendResponse(res, {
    success: true,
    message: 'Task marked as skipped',
    data: { task },
    errors: [],
  });
});

module.exports = {
  createTaskController,
  listTasksController,
  getTodayTasksController,
  getUpcomingTasksController,
  updateTaskController,
  deleteTaskController,
  completeTaskController,
  skipTaskController,
};
