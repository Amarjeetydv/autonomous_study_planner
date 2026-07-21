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

  if (!query.goalId && !query.planId) {
    const AIPlan = require('../../models/AIPlan');
    const DailyTask = require('../../models/DailyTask');
    let activePlan = await AIPlan.findOne({ studentId, isCurrent: true }).sort({ updatedAt: -1 }).lean();
    if (!activePlan) {
      activePlan = await AIPlan.findOne({ studentId, status: 'active' }).sort({ createdAt: -1 }).lean();
    }
    if (activePlan) {
      const existingCount = await DailyTask.countDocuments({ planId: activePlan._id });
      if (existingCount === 0) {
        await createTasksFromPlan(activePlan);
      }
      filter.planId = activePlan._id;
    }
  }

  if (query.from || query.to) {
    filter.scheduledDate = {};
    if (query.from) filter.scheduledDate.$gte = new Date(query.from);
    if (query.to) filter.scheduledDate.$lte = new Date(query.to);
  }

  return tasksRepository.find(filter);
};

const getTodayTasks = async (studentId, query = {}) => {
  const AIPlan = require('../../models/AIPlan');
  const DailyTask = require('../../models/DailyTask');
  let activePlan = await AIPlan.findOne({ studentId, isCurrent: true }).sort({ updatedAt: -1 }).lean();
  if (!activePlan) {
    activePlan = await AIPlan.findOne({ studentId, status: 'active' }).sort({ createdAt: -1 }).lean();
  }

  if (activePlan) {
    const existingCount = await DailyTask.countDocuments({ planId: activePlan._id });
    if (existingCount === 0) {
      await createTasksFromPlan(activePlan);
    }
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const filter = {
    studentId,
    scheduledDate: { $gte: startOfToday, $lte: endOfToday },
  };

  if (activePlan) {
    filter.planId = activePlan._id;
  }

  return tasksRepository.find(filter);
};

const getUpcomingTasks = async (studentId) => {
  const AIPlan = require('../../models/AIPlan');
  const DailyTask = require('../../models/DailyTask');
  let activePlan = await AIPlan.findOne({ studentId, isCurrent: true }).sort({ updatedAt: -1 }).lean();
  if (!activePlan) {
    activePlan = await AIPlan.findOne({ studentId, status: 'active' }).sort({ createdAt: -1 }).lean();
  }

  if (activePlan) {
    const existingCount = await DailyTask.countDocuments({ planId: activePlan._id });
    if (existingCount === 0) {
      await createTasksFromPlan(activePlan);
    }
  }
  const startOfTomorrow = new Date();
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  startOfTomorrow.setHours(0, 0, 0, 0);

  const filter = {
    studentId,
    scheduledDate: { $gte: startOfTomorrow },
  };

  if (activePlan) {
    filter.planId = activePlan._id;
  }

  return tasksRepository.find(filter);
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

// AI Integration: Parser to generate study blocks & calendar events
const createTasksFromPlan = async (plan) => {
  try {
    const DailyTask = require('../../models/DailyTask');
    const Goal = require('../../models/Goal');
    const CalendarEvent = require('../../models/CalendarEvent');

    const goal = await Goal.findById(plan.goalId);
    if (!goal) return [];

    // Clear existing tasks & calendar events for this plan to avoid duplicates
    await DailyTask.deleteMany({ planId: plan._id });
    await CalendarEvent.deleteMany({ 'metadata.planId': plan._id });

    const tasksToInsert = [];
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const targetDateObj = goal.targetDate ? new Date(goal.targetDate) : new Date(Date.now() + 7 * 86400000);
    const totalDays = Math.max(1, Math.ceil((targetDateObj.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const breakDaysList = goal.breakDays || [];
    const subjectId = goal.selectedSubjects?.[0] || null;

    // 1. Generate Daily study blocks tasks (starting from Day 0 = Today)
    const dailyBlocks = plan.scheduler?.dailyTasks || [];
    const fallbackBlocks = dailyBlocks.length > 0 ? dailyBlocks : [
      { task: 'Core Concepts & Study Session', time: '18:00 - 19:30', duration: 90, type: 'Study' },
      { task: 'Practice Problem Solving & Notes', time: '20:00 - 21:00', duration: 60, type: 'Study' }
    ];

    for (let i = 0; i <= totalDays; i++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(startDate.getDate() + i);

      const dayName = currentDay.toLocaleDateString('en-US', { weekday: 'long' });
      if (breakDaysList.includes(dayName) && i > 0) {
        continue;
      }

      fallbackBlocks.forEach((block) => {
        let startTime = '18:00';
        let endTime = '19:00';
        if (block.time && block.time.includes('-')) {
          const parts = block.time.split('-');
          startTime = parts[0].trim();
          endTime = parts[1].trim();
        } else if (block.time && block.time.toLowerCase() !== 'flexible') {
          startTime = block.time.trim();
          const duration = parseDurationToMinutes(block.durationMinutes || block.duration || 60);
          const [h, m] = startTime.split(':').map(Number);
          if (!isNaN(h) && !isNaN(m)) {
            const endM = (m + duration) % 60;
            const endH = (h + Math.floor((m + duration) / 60)) % 24;
            endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
          }
        }
        
        const weekNumber = Math.floor(i / 7) + 1;
        const dayNumber = (i % 7) + 1;

        tasksToInsert.push({
          studentId: plan.studentId,
          goalId: plan.goalId,
          planId: plan._id,
          subjectId,
          title: block.task || 'AI Study Session',
          description: `Study block session (${block.type || 'Study'}) - Time: ${block.time || 'Flexible'}`,
          taskType: block.type === 'Revision' ? 'Revision' : (block.type === 'Mock Test' ? 'Mock Test' : 'Study'),
          scheduledDate: new Date(currentDay),
          estimatedDuration: parseDurationToMinutes(block.durationMinutes || block.duration || 60),
          priority: 'Medium',
          status: 'Pending',
          aiGenerated: true,
          plannedDate: new Date(currentDay),
          plannedStartTime: startTime,
          plannedEndTime: endTime,
          timezone: goal.timezone || 'UTC',
          weekNumber,
          dayNumber,
          isRescheduled: false,
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
      const daysDiff = Math.max(0, Math.ceil((revDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const weekNumber = Math.max(1, Math.floor(daysDiff / 7) + 1);
      const dayNumber = Math.max(1, (daysDiff % 7) + 1);

      tasksToInsert.push({
        studentId: plan.studentId,
        goalId: plan.goalId,
        planId: plan._id,
        subjectId,
        title: `Revision: ${rev.topic}`,
        description: `Spaced revision session. Logic: ${plan.revisionPlan?.logic || 'Spaced retention'}`,
        taskType: 'Revision',
        scheduledDate: revDate,
        estimatedDuration: 45,
        priority: 'High',
        status: 'Pending',
        aiGenerated: true,
        plannedDate: revDate,
        plannedStartTime: '09:00',
        plannedEndTime: '09:45',
        timezone: goal.timezone || 'UTC',
        weekNumber,
        dayNumber,
        isRescheduled: false,
      });
    });

    // 3. Generate Mock Test Tasks
    const mockTests = plan.quizPlan?.quizSchedule || plan.quizSchedule || [];
    mockTests.forEach((quiz) => {
      let qDate = new Date(quiz.date || quiz.scheduledDate);
      if (Number.isNaN(qDate.getTime())) {
        qDate = new Date();
      }
      const daysDiff = Math.max(0, Math.ceil((qDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const weekNumber = Math.max(1, Math.floor(daysDiff / 7) + 1);
      const dayNumber = Math.max(1, (daysDiff % 7) + 1);

      tasksToInsert.push({
        studentId: plan.studentId,
        goalId: plan.goalId,
        planId: plan._id,
        subjectId,
        title: `Mock Exam: ${quiz.type || quiz.examType || 'Practice Quiz'}`,
        description: `Diagnostic practice quiz covering ${quiz.focus || 'Current topics'}`,
        taskType: 'Mock Test',
        scheduledDate: qDate,
        estimatedDuration: quiz.durationMinutes || 60,
        priority: 'High',
        status: 'Pending',
        aiGenerated: true,
        plannedDate: qDate,
        plannedStartTime: '10:00',
        plannedEndTime: '11:00',
        timezone: goal.timezone || 'UTC',
        weekNumber,
        dayNumber,
        isRescheduled: false,
      });
    });

    if (tasksToInsert.length > 0) {
      const insertedDocs = await tasksRepository.insertMany(tasksToInsert);
      
      const calendarEventsToInsert = insertedDocs.map((taskDoc) => {
        const sTime = taskDoc.plannedStartTime || '18:00';
        const eTime = taskDoc.plannedEndTime || '19:00';

        const startDT = new Date(taskDoc.scheduledDate);
        const [sh, sm] = sTime.split(':').map(Number);
        if (!isNaN(sh) && !isNaN(sm)) startDT.setHours(sh, sm, 0, 0);

        const endDT = new Date(taskDoc.scheduledDate);
        const [eh, em] = eTime.split(':').map(Number);
        if (!isNaN(eh) && !isNaN(em)) endDT.setHours(eh, em, 0, 0);

        return {
          userId: taskDoc.studentId,
          title: taskDoc.title,
          description: taskDoc.description,
          eventType: taskDoc.taskType === 'Mock Test' ? 'quiz' : (taskDoc.taskType === 'Revision' ? 'reminder' : 'studyBlock'),
          startDateTime: startDT,
          endDateTime: endDT,
          status: 'scheduled',
          sourceType: 'task',
          sourceId: taskDoc._id,
          metadata: { planId: taskDoc.planId, goalId: taskDoc.goalId }
        };
      });

      await CalendarEvent.insertMany(calendarEventsToInsert);
      logger.info(`Inserted ${insertedDocs.length} tasks & ${calendarEventsToInsert.length} calendar events for plan ${plan._id}`);
      return insertedDocs;
    }

    return [];
  } catch (err) {
    logger.error('Failed to create tasks from AIPlan', { planId: plan._id, error: err.message, stack: err.stack });
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
