const tasksRepository = require('./tasks.repository');
const Goal = require('../../models/Goal');
const AppError = require('../../utils/errors/AppError');
const logger = require('../../config/logger');

const parseDurationToMinutes = (durationStr) => {
  if (!durationStr) return 60;
  const str = String(durationStr).toLowerCase();
  const match = str.match(/(\d+)/);
  if (!match) return 60;
  const val = parseInt(match[1], 10);
  if (str.includes('hour') || str.includes('hr')) {
    return val * 60;
  }
  return val;
};

const createTask = async ({ studentId, data }) => {
  return tasksRepository.create({
    ...data,
    studentId,
    status: 'Pending',
    completionPercentage: 0,
  });
};

const listTasks = async ({ studentId, query = {} }) => {
  const filter = { studentId };

  if (query.status) filter.status = query.status;
  if (query.taskType) filter.taskType = query.taskType;
  if (query.goalId) filter.goalId = query.goalId;

  if (query.from || query.to) {
    filter.scheduledDate = {};
    if (query.from) filter.scheduledDate.$gte = new Date(query.from);
    if (query.to) filter.scheduledDate.$lte = new Date(query.to);
  }

  return tasksRepository.find(filter);
};

const getTodayTasks = async (studentId) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  return tasksRepository.find({
    studentId,
    scheduledDate: { $gte: startOfToday, $lte: endOfToday },
  });
};

const getUpcomingTasks = async (studentId) => {
  const startOfTomorrow = new Date();
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  startOfTomorrow.setHours(0, 0, 0, 0);

  return tasksRepository.find({
    studentId,
    scheduledDate: { $gte: startOfTomorrow },
  });
};

const updateTask = async ({ taskId, studentId, data }) => {
  const task = await tasksRepository.findById(taskId);
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  if (task.studentId.toString() !== studentId.toString()) {
    throw new AppError('Unauthorized access to task', 403);
  }

  return tasksRepository.findByIdAndUpdate(taskId, data, { new: true });
};

const deleteTask = async ({ taskId, studentId }) => {
  const task = await tasksRepository.findById(taskId);
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  if (task.studentId.toString() !== studentId.toString()) {
    throw new AppError('Unauthorized access to task', 403);
  }

  await tasksRepository.deleteById(taskId);
  return { deleted: true };
};

const completeTask = async ({ taskId, studentId, actualStudyTime, notes }) => {
  const task = await tasksRepository.findById(taskId);
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  if (task.studentId.toString() !== studentId.toString()) {
    throw new AppError('Unauthorized access to task', 403);
  }

  const updated = await tasksRepository.findByIdAndUpdate(taskId, {
    status: 'Completed',
    completionPercentage: 100,
    actualStudyTime: Number(actualStudyTime) || task.estimatedDuration,
    notes: notes || task.notes,
  }, { new: true });

  try {
    const gamificationService = require('../gamification/gamification.service');
    await gamificationService.addXP(studentId, 100, 'Daily Study Completion');
    await gamificationService.evaluateAchievements(studentId, 'task_count', 1);
    if (task.taskType === 'Revision') {
      await gamificationService.evaluateAchievements(studentId, 'revision_count', 1);
    }
  } catch (err) {
    logger.error('Failed to trigger gamification updates on task complete success', { error: err.message });
  }

  return updated;
};

const skipTask = async ({ taskId, studentId, notes }) => {
  const task = await tasksRepository.findById(taskId);
  if (!task) {
    throw new AppError('Task not found', 404);
  }

  if (task.studentId.toString() !== studentId.toString()) {
    throw new AppError('Unauthorized access to task', 403);
  }

  const updatedTask = await tasksRepository.findByIdAndUpdate(taskId, {
    status: 'Skipped',
    completionPercentage: 0,
    notes: notes || task.notes,
  }, { new: true });

  try {
    const schedulerService = require('../scheduler/scheduler.service');
    await schedulerService.recalculateSchedule({ studentId, triggerEvent: 'task_skipped' });
  } catch (err) {
    logger.error('Failed to trigger reschedule recalculation on task skip', { error: err.message });
  }

  return updatedTask;
};

// AI Integration: Parser to generate study blocks
const createTasksFromPlan = async (plan) => {
  try {
    const goal = await Goal.findById(plan.goalId);
    if (!goal) return [];

    const tasksToInsert = [];
    const startDate = new Date();
    const endDate = new Date(goal.targetDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const breakDaysList = goal.breakDays || [];

    // Resolve subject references from goal if possible
    const subjectId = goal.selectedSubjects?.[0] || null;

    // 1. Generate Daily study blocks tasks
    const dailyBlocks = plan.scheduler?.dailyTasks || [];
    for (let i = 0; i <= totalDays; i++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(startDate.getDate() + i);

      // Check if it is a break day
      const dayName = currentDay.toLocaleDateString('en-US', { weekday: 'long' });
      if (breakDaysList.includes(dayName)) {
        continue;
      }

      dailyBlocks.forEach((block) => {
        tasksToInsert.push({
          studentId: plan.studentId,
          goalId: plan.goalId,
          planId: plan._id,
          subjectId,
          title: block.task || 'AI Study Session',
          description: `Time segment: ${block.duration || 'Flexible'} (${block.type || 'Study'})`,
          taskType: block.type === 'Revision' ? 'Revision' : (block.type === 'Mock Test' ? 'Mock Test' : 'Study'),
          scheduledDate: new Date(currentDay),
          estimatedDuration: parseDurationToMinutes(block.duration),
          priority: 'Medium',
          status: 'Pending',
          aiGenerated: true,
        });
      });
    }

    // 2. Generate Revision Tasks
    const revisionList = plan.revisionPlan?.revisionPlan || [];
    revisionList.forEach((rev) => {
      let revDate = new Date(rev.date);
      if (Number.isNaN(revDate.getTime())) {
        revDate = new Date();
      }
      tasksToInsert.push({
        studentId: plan.studentId,
        goalId: plan.goalId,
        planId: plan._id,
        subjectId,
        title: `Revision: ${rev.topic}`,
        description: `Spaced revision block. Logic: ${plan.revisionPlan?.logic || ''}`,
        taskType: 'Revision',
        scheduledDate: revDate,
        estimatedDuration: 45, // default
        priority: 'High',
        status: 'Pending',
        aiGenerated: true,
      });
    });

    // 3. Generate Mock Test Tasks
    const mockTests = plan.quizPlan?.quizSchedule || [];
    mockTests.forEach((quiz) => {
      let qDate = new Date(quiz.scheduledDate);
      if (Number.isNaN(qDate.getTime())) {
        qDate = new Date();
      }
      tasksToInsert.push({
        studentId: plan.studentId,
        goalId: plan.goalId,
        planId: plan._id,
        subjectId,
        title: `Mock Exam: ${quiz.examType}`,
        description: `Diagnostic practice session.`,
        taskType: 'Mock Test',
        scheduledDate: qDate,
        estimatedDuration: quiz.durationMinutes || 120,
        priority: 'High',
        status: 'Pending',
        aiGenerated: true,
      });
    });

    if (tasksToInsert.length > 0) {
      await tasksRepository.insertMany(tasksToInsert);
      logger.info(`Inserted ${tasksToInsert.length} study tasks dynamically for plan ${plan._id}`);
    }

    return tasksToInsert;
  } catch (err) {
    logger.error('Failed to create tasks from AIPlan', { planId: plan._id, error: err.message });
    return [];
  }
};

module.exports = {
  createTask,
  listTasks,
  getTodayTasks,
  getUpcomingTasks,
  updateTask,
  deleteTask,
  completeTask,
  skipTask,
  createTasksFromPlan,
};
