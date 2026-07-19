const express = require('express');
const { protect, authorizeRoles } = require('../auth/auth.middleware');
const validateRequest = require('../../middlewares/validateRequest.middleware');
const {
  listNotificationsController,
  listUnreadNotificationsController,
  markAsReadController,
  markAllAsReadController,
  deleteNotificationController,
} = require('./notifications.controller');
const {
  notificationIdParamValidator,
} = require('./notifications.validators');

const router = express.Router();

const notificationAccess = [protect, authorizeRoles('Student', 'Admin')];

router.get('/', ...notificationAccess, listNotificationsController);
router.get('/unread', ...notificationAccess, listUnreadNotificationsController);
router.patch('/read-all', ...notificationAccess, markAllAsReadController);
router.patch('/:id/read', ...notificationAccess, notificationIdParamValidator, validateRequest, markAsReadController);
router.delete('/:id', ...notificationAccess, notificationIdParamValidator, validateRequest, deleteNotificationController);

module.exports = router;
