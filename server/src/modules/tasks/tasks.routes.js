const express = require('express');
const { protect, authorizeRoles } = require('../auth/auth.middleware');
const validateRequest = require('../../middlewares/validateRequest.middleware');
const {
  createTaskController,
  listTasksController,
  getTodayTasksController,
  getUpcomingTasksController,
  updateTaskController,
  deleteTaskController,
  completeTaskController,
  skipTaskController,
} = require('./tasks.controller');
const {
  createTaskValidators,
  updateTaskValidators,
  listTasksQueryValidators,
  taskIdParamValidator,
} = require('./tasks.validators');

const router = express.Router();

const taskAccess = [protect, authorizeRoles('Student', 'Admin')];

router.post('/', ...taskAccess, createTaskValidators, validateRequest, createTaskController);
router.get('/', ...taskAccess, listTasksQueryValidators, validateRequest, listTasksController);
router.get('/today', ...taskAccess, getTodayTasksController);
router.get('/upcoming', ...taskAccess, getUpcomingTasksController);

router.patch('/:taskId', ...taskAccess, taskIdParamValidator, updateTaskValidators, validateRequest, updateTaskController);
router.delete('/:taskId', ...taskAccess, taskIdParamValidator, validateRequest, deleteTaskController);

router.post('/:taskId/complete', ...taskAccess, taskIdParamValidator, validateRequest, completeTaskController);
router.post('/:taskId/skip', ...taskAccess, taskIdParamValidator, validateRequest, skipTaskController);

module.exports = router;
