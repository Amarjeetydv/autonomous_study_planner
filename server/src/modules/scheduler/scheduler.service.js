const schedulerRepository = require('./scheduler.repository');
const DailyTask = require('../../models/DailyTask');
const Goal = require('../../models/Goal');
const AppError = require('../../utils/errors/AppError');
const logger = require('../../config/logger');

const getDayName = (date) => {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

const recalculateSchedule = async ({ studentId, triggerEvent = 'manual' }) => {
  const goal = await Goal.findOne({ studentId, status: 'active' });
  if (!goal) {
    throw new AppError('No active study goal found for student', 404);
  }

  // Clear existing previews
  const oldPreview = await schedulerRepository.findActivePreview(studentId);
  if (oldPreview) {
    await schedulerRepository.updateLogStatus(oldPreview._id, 'rejected');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch all incomplete tasks
  const tasks = await DailyTask.find({
    studentId,
    status: { $in: ['Pending', 'In Progress'] },
  }).lean();

  if (tasks.length === 0) {
    return schedulerRepository.createLog({
      studentId,
      goalId: goal._id,
      triggerEvent,
      changes: [],
      status: 'preview',
    });
  }

  const targetDate = new Date(goal.targetDate);
  targetDate.setHours(23, 59, 59, 999);

  // 1. Conflict Detection: Find missed (overdue) and upcoming tasks
  const missedTasks = [];
  const upcomingTasks = [];

  tasks.forEach((task) => {
    const taskDate = new Date(task.scheduledDate);
    if (taskDate.getTime() < today.getTime()) {
      missedTasks.push(task);
    } else if (taskDate.getTime() <= targetDate.getTime()) {
      upcomingTasks.push(task);
    }
  });

  // Tasks to reschedule
  const allTasks = [...missedTasks, ...upcomingTasks];

  // 2. Priority Scoring
  // Sort rules: Mock Tests first, Revisions second, Weak subjects third, Priority subjects fourth, others last.
  const weakSubjectIds = (goal.weakSubjects || []).map(String);
  const prioritySubjectIds = (goal.prioritySubjects || []).map(String);

  const getPriorityScore = (task) => {
    let score = 0;
    if (task.taskType === 'Mock Test') score += 1000;
    if (task.taskType === 'Revision') score += 500;
    
    const subId = task.subjectId ? task.subjectId.toString() : '';
    if (weakSubjectIds.includes(subId)) score += 100;
    if (prioritySubjectIds.includes(subId)) score += 50;

    if (task.priority === 'High') score += 10;
    if (task.priority === 'Medium') score += 5;
    return score;
  };

  // Sort tasks: High priority scores are scheduled first
  allTasks.sort((a, b) => getPriorityScore(b) - getPriorityScore(a));

  // 3. Workload Balancer & Time Slot Optimizer
  // Allocate study days from today until target date, respecting break days
  const dailyLimitMinutes = (goal.dailyStudyHours || 4) * 60;
  const breakDays = goal.breakDays || [];

  const dayLoads = new Map(); // Date string -> minutes currently loaded
  const changes = [];

  // Initialize today and future days
  const futureDays = [];
  let dayOffset = 0;
  
  while (true) {
    const loopDay = new Date(today);
    loopDay.setDate(today.getDate() + dayOffset);
    if (loopDay.getTime() > targetDate.getTime()) {
      break;
    }

    const dayName = getDayName(loopDay);
    if (!breakDays.includes(dayName)) {
      futureDays.push(loopDay);
      dayLoads.set(loopDay.toDateString(), 0);
    }
    dayOffset++;
  }

  if (futureDays.length === 0) {
    throw new AppError('No available study days before target exam date. Please extend your goal target date.', 400);
  }

  // Distribute tasks
  allTasks.forEach((task) => {
    const originalDate = new Date(task.scheduledDate);
    const duration = task.estimatedDuration || 60;

    let targetDay = null;

    // A. Revision Protector & Mock Test Preservation
    // Try to place Mock Test/Revision on their original date if it fits and is in the future
    if (['Mock Test', 'Revision'].includes(task.taskType) && originalDate.getTime() >= today.getTime()) {
      const origStr = originalDate.toDateString();
      if (dayLoads.has(origStr)) {
        const currentLoad = dayLoads.get(origStr);
        if (currentLoad + duration <= dailyLimitMinutes) {
          targetDay = originalDate;
        }
      }
    }

    // B. Workload Balancer: Find first day with available capacity
    if (!targetDay) {
      for (const day of futureDays) {
        const dayStr = day.toDateString();
        const currentLoad = dayLoads.get(dayStr);
        if (currentLoad + duration <= dailyLimitMinutes) {
          targetDay = day;
          break;
        }
      }
    }

    // C. Force distribution if target limit is saturated (minimum overflow spreading)
    if (!targetDay) {
      // Find day with lowest load
      let minLoadDay = futureDays[0];
      let minLoad = dayLoads.get(minLoadDay.toDateString()) || 0;
      
      for (const day of futureDays) {
        const load = dayLoads.get(day.toDateString()) || 0;
        if (load < minLoad) {
          minLoad = load;
          minLoadDay = day;
        }
      }
      targetDay = minLoadDay;
    }

    // Load minutes
    const dayStr = targetDay.toDateString();
    dayLoads.set(dayStr, (dayLoads.get(dayStr) || 0) + duration);

    // Record change if date differed
    if (originalDate.toDateString() !== targetDay.toDateString()) {
      let reason = 'Balanced daily workload limits';
      if (task.taskType === 'Mock Test') reason = 'Preserved mock exam interval';
      if (task.taskType === 'Revision') reason = 'Maintained revision spaced checks';
      if (weakSubjectIds.includes(task.subjectId?.toString())) reason = 'Prioritized weaker academic subject';

      changes.push({
        taskId: task._id,
        title: task.title,
        oldDate: originalDate,
        newDate: targetDay,
        reason,
      });
    }
  });

  // Create proposed changes log
  return schedulerRepository.createLog({
    studentId,
    goalId: goal._id,
    triggerEvent,
    changes,
    status: 'preview',
  });
};

const getActivePreview = async (studentId) => {
  const preview = await schedulerRepository.findActivePreview(studentId);
  if (!preview) {
    return { changes: [] };
  }
  return preview;
};

const applySchedule = async (studentId) => {
  const preview = await schedulerRepository.findActivePreview(studentId);
  if (!preview) {
    throw new AppError('No active scheduling preview found', 404);
  }

  // Update DailyTasks dates
  const updatePromises = preview.changes.map((change) => {
    return DailyTask.findByIdAndUpdate(change.taskId, {
      scheduledDate: change.newDate,
      rescheduledFrom: change.taskId,
    });
  });

  await Promise.all(updatePromises);
  
  // Set applied state
  return schedulerRepository.updateLogStatus(preview._id, 'applied', new Date());
};

const rejectSchedule = async (studentId) => {
  const preview = await schedulerRepository.findActivePreview(studentId);
  if (!preview) {
    throw new AppError('No active scheduling preview found', 404);
  }

  return schedulerRepository.updateLogStatus(preview._id, 'rejected');
};

const getHistory = async (studentId) => {
  return schedulerRepository.findHistory(studentId);
};

module.exports = {
  recalculateSchedule,
  getActivePreview,
  applySchedule,
  rejectSchedule,
  getHistory,
};
