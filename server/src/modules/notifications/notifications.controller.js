const asyncHandler = require('../../middlewares/asyncHandler');
const { sendResponse } = require('../../utils/response');
const notificationsService = require('./notifications.service');

const listNotificationsController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const notifications = await notificationsService.listNotifications(userId);

  return sendResponse(res, {
    success: true,
    message: 'Notifications list retrieved successfully',
    data: { notifications },
    errors: [],
  });
});

const listUnreadNotificationsController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const notifications = await notificationsService.listUnreadNotifications(userId);

  return sendResponse(res, {
    success: true,
    message: 'Unread notifications count retrieved successfully',
    data: { notifications },
    errors: [],
  });
});

const markAsReadController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const notificationId = req.params.id;

  const notification = await notificationsService.markAsRead({ userId, notificationId });

  return sendResponse(res, {
    success: true,
    message: 'Notification marked as read successfully',
    data: { notification },
    errors: [],
  });
});

const markAllAsReadController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  await notificationsService.markAllAsRead(userId);

  return sendResponse(res, {
    success: true,
    message: 'All notifications marked as read successfully',
    data: {},
    errors: [],
  });
});

const deleteNotificationController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const notificationId = req.params.id;

  await notificationsService.deleteNotification({ userId, notificationId });

  return sendResponse(res, {
    success: true,
    message: 'Notification deleted successfully',
    data: {},
    errors: [],
  });
});

module.exports = {
  listNotificationsController,
  listUnreadNotificationsController,
  markAsReadController,
  markAllAsReadController,
  deleteNotificationController,
};
