const notificationsRepository = require('./notifications.repository');
const Notification = require('../../models/Notification');
const AppError = require('../../utils/errors/AppError');
const logger = require('../../config/logger');

const triggerNotification = async ({ userId, type, title, message, priority = 'Medium', relatedEntityType = '', relatedEntityId = null }) => {
  const payload = {
    userId,
    type,
    title,
    message,
    priority,
    relatedEntityType,
    relatedEntityId,
    deliveredAt: new Date(),
  };

  // Log delivery trace (decoupled delivery entry point)
  logger.info(`Notification dispatched: [${type}] "${title}" to user ${userId}`);
  
  return notificationsRepository.createNotification(payload);
};

const generateAutomaticNotifications = async (userId) => {
  try {
    const Goal = require('../../models/Goal');
    const KnowledgeMastery = require('../../models/KnowledgeMastery');
    const DailyTask = require('../../models/DailyTask');
    const DailyCheckIn = require('../../models/DailyCheckIn');

    const activeGoal = await Goal.findOne({ studentId: userId, status: 'active' });
    if (!activeGoal) return;

    // 1. Goal Deadline approaches
    const diffTime = new Date(activeGoal.targetDate).getTime() - Date.now();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0 && diffDays <= 7) {
      const title = 'Goal Deadline Approaching';
      const existing = await Notification.findOne({ userId, title });
      if (!existing) {
        await triggerNotification({
          userId,
          type: 'Goal Deadline Reminder',
          title,
          message: `Your exam "${activeGoal.title}" is in ${diffDays} days! Optimize study times and review weak topics.`,
          priority: 'High',
          relatedEntityType: 'Goal',
          relatedEntityId: activeGoal._id,
        });
      }
    }

    // 2. Revision due
    const revisionQueue = await KnowledgeMastery.find({ userId, nextRevisionDate: { $lte: new Date() } });
    if (revisionQueue.length > 0) {
      const title = 'Revisions Due';
      const existing = await Notification.findOne({ userId, title });
      if (!existing) {
        await triggerNotification({
          userId,
          type: 'Revision Reminder',
          title,
          message: `You have ${revisionQueue.length} topic revisions scheduled for spaced review. Review them to prevent forgetting curve resets!`,
          priority: 'Medium',
        });
      }
    }

    // 3. Daily check-in missing
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayCheckIn = await DailyCheckIn.findOne({
      userId,
      date: { $gte: yesterday, $lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000) }
    });
    if (!yesterdayCheckIn) {
      const title = 'Missing Daily Check-in';
      const existing = await Notification.findOne({ userId, title });
      if (!existing) {
        await triggerNotification({
          userId,
          type: 'Daily Check-in Reminder',
          title,
          message: 'You did not submit a performance check-in yesterday. Log it now to preserve your consistency streak indexes!',
          priority: 'High',
        });
      }
    }

    // 4. Today's study session begins
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTasks = await DailyTask.find({
      userId,
      scheduledDate: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    });
    if (todayTasks.length > 0) {
      const title = 'Study Session Begins';
      const existing = await Notification.findOne({ userId, title });
      if (!existing) {
        await triggerNotification({
          userId,
          type: 'Study Reminder',
          title,
          message: `Your study session is scheduled for today. Complete your ${todayTasks.length} pending focus study blocks!`,
          priority: 'Medium',
        });
      }
    }
  } catch (err) {
    logger.error('Failed to generate automatic notifications', { error: err.message });
  }
};

const listNotifications = async (userId) => {
  await generateAutomaticNotifications(userId);
  return notificationsRepository.findNotifications({ userId });
};

const listUnreadNotifications = async (userId) => {
  return notificationsRepository.findNotifications({ userId, read: false });
};

const markAsRead = async ({ userId, notificationId }) => {
  const notif = await notificationsRepository.markAsRead(userId, notificationId);
  if (!notif) {
    throw new AppError('Notification not found or access denied', 404);
  }
  return notif;
};

const markAllAsRead = async (userId) => {
  return notificationsRepository.markAllAsRead(userId);
};

const deleteNotification = async ({ userId, notificationId }) => {
  const notif = await notificationsRepository.deleteNotification(userId, notificationId);
  if (!notif) {
    throw new AppError('Notification not found or access denied', 404);
  }
  return notif;
};

module.exports = {
  triggerNotification,
  listNotifications,
  listUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
