const { EventEmitter } = require('events');
const { NOTIFICATION_CHANNELS, NOTIFICATION_TYPES } = require('../constants');
const { sendEmail } = require('./email.service');

const notificationBus = new EventEmitter();

const normalizeNotificationPayload = (payload = {}) => ({
  type: payload.type || NOTIFICATION_TYPES.SYSTEM,
  channel: payload.channel || NOTIFICATION_CHANNELS.IN_APP,
  recipientId: payload.recipientId || null,
  subject: payload.subject || payload.title || 'Notification',
  title: payload.title || 'Notification',
  message: payload.message || '',
  metadata: payload.metadata || {},
  email: payload.email || null,
});

const createNotificationService = ({ persistNotification, queueAdapter } = {}) => {
  const sendInAppNotification = async (payload) => {
    const notification = normalizeNotificationPayload(payload);

    if (typeof persistNotification === 'function') {
      const savedNotification = await persistNotification(notification);
      notificationBus.emit('notification.inApp.created', savedNotification || notification);
      return savedNotification || notification;
    }

    notificationBus.emit('notification.inApp.created', notification);
    return notification;
  };

  const sendEmailNotification = async (payload) => {
    const notification = normalizeNotificationPayload(payload);

    if (!notification.email) {
      throw new Error('Email address is required for email notifications');
    }

    const result = await sendEmail({
      to: notification.email,
      subject: notification.subject,
      text: notification.message,
      html: payload.html || `<p>${notification.message}</p>`,
    });

    notificationBus.emit('notification.email.sent', notification);
    return result;
  };

  const queueNotification = async (payload) => {
    const notification = normalizeNotificationPayload(payload);

    if (queueAdapter && typeof queueAdapter.add === 'function') {
      const queuedJob = await queueAdapter.add('notification.dispatch', notification);
      notificationBus.emit('notification.queued', notification);
      return queuedJob;
    }

    notificationBus.emit('notification.queued', notification);
    return notification;
  };

  const dispatchNotification = async (payload) => {
    const notification = normalizeNotificationPayload(payload);

    if (notification.channel === NOTIFICATION_CHANNELS.EMAIL) {
      return sendEmailNotification(notification);
    }

    if (notification.channel === NOTIFICATION_CHANNELS.IN_APP) {
      return sendInAppNotification(notification);
    }

    if (notification.channel === NOTIFICATION_CHANNELS.PUSH) {
      notificationBus.emit('notification.push.requested', notification);
      return notification;
    }

    if (notification.channel === NOTIFICATION_CHANNELS.SMS) {
      notificationBus.emit('notification.sms.requested', notification);
      return notification;
    }

    return sendInAppNotification(notification);
  };

  return {
    sendInAppNotification,
    sendEmailNotification,
    queueNotification,
    dispatchNotification,
    bus: notificationBus,
  };
};

const notificationService = createNotificationService();

module.exports = {
  notificationBus,
  createNotificationService,
  notificationService,
  normalizeNotificationPayload,
};
