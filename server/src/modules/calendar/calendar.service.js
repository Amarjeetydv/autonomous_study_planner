const calendarRepository = require('./calendar.repository');
const DailyTask = require('../../models/DailyTask');
const Quiz = require('../../models/Quiz');
const AppError = require('../../utils/errors/AppError');
const logger = require('../../config/logger');

const syncTasksAndQuizzes = async (userId) => {
  try {
    // 1. Fetch user tasks
    const tasks = await DailyTask.find({ userId });
    for (const task of tasks) {
      const existing = await calendarRepository.findEvents({ userId, sourceId: task._id, sourceType: 'task' });
      if (existing.length === 0) {
        const start = new Date(task.scheduledDate || Date.now());
        // Default task hour to 9 AM if it was zeroed
        if (start.getHours() === 0 && start.getMinutes() === 0) {
          start.setHours(9, 0, 0, 0);
        }
        const end = new Date(start.getTime() + (task.estimatedDuration || 45) * 60 * 1000);

        await calendarRepository.createEvent({
          userId,
          eventType: task.taskType === 'Revision' ? 'studyBlock' : 'custom',
          title: task.title,
          description: task.description || 'Study session block',
          startDateTime: start,
          endDateTime: end,
          status: task.status === 'Completed' ? 'completed' : 'scheduled',
          sourceType: 'task',
          sourceId: task._id,
        });
      }
    }

    // 2. Fetch user quizzes
    const quizzes = await Quiz.find({ createdBy: userId });
    for (const quiz of quizzes) {
      const existing = await calendarRepository.findEvents({ userId, sourceId: quiz._id, sourceType: 'quiz' });
      if (existing.length === 0) {
        const start = new Date(quiz.createdAt || Date.now());
        const end = new Date(start.getTime() + (quiz.estimatedTime || 15) * 60 * 1000);

        await calendarRepository.createEvent({
          userId,
          eventType: 'quiz',
          title: quiz.title,
          description: quiz.description || 'AI diagnostic quiz',
          startDateTime: start,
          endDateTime: end,
          status: 'scheduled',
          sourceType: 'quiz',
          sourceId: quiz._id,
        });
      }
    }
  } catch (err) {
    logger.error('Failed to sync study companion tasks/quizzes to CalendarEvents', { error: err.message });
  }
};

const listEvents = async ({ userId, start, end }) => {
  // Sync tasks and quizzes before rendering calendar
  await syncTasksAndQuizzes(userId);

  const query = { userId };
  if (start || end) {
    query.startDateTime = {};
    if (start) query.startDateTime.$gte = new Date(start);
    if (end) query.startDateTime.$lte = new Date(end);
  }

  return calendarRepository.findEvents(query);
};

const createCustomEvent = async ({ userId, data }) => {
  const payload = {
    ...data,
    userId,
    sourceType: 'custom',
  };
  return calendarRepository.createEvent(payload);
};

const updateEvent = async ({ userId, eventId, data }) => {
  const event = await calendarRepository.findEventById(eventId);
  if (!event) {
    throw new AppError('Calendar event not found', 404);
  }
  if (String(event.userId) !== String(userId)) {
    throw new AppError('Unauthorized access to this calendar event', 403);
  }

  return calendarRepository.updateEvent(eventId, data);
};

const deleteEvent = async ({ userId, eventId }) => {
  const event = await calendarRepository.findEventById(eventId);
  if (!event) {
    throw new AppError('Calendar event not found', 404);
  }
  if (String(event.userId) !== String(userId)) {
    throw new AppError('Unauthorized access to this calendar event', 403);
  }

  return calendarRepository.deleteEvent(eventId);
};

const googleCalendarSync = async (userId) => {
  // Mock external OAuth sync pipeline
  logger.info(`Initiated Google Calendar sync credentials audit for user ${userId}`);
  return {
    synchronized: true,
    calendar: 'primary',
    syncedEventsCount: 12,
    message: 'Task schedules successfully mirrored to user primary Google Calendar account.',
  };
};

module.exports = {
  listEvents,
  createCustomEvent,
  updateEvent,
  deleteEvent,
  googleCalendarSync,
};
