const Notification = require('../../models/Notification');

const createNotification = async (data) => {
  return Notification.create(data);
};

const findNotifications = async (query = {}, sort = { createdAt: -1 }) => {
  return Notification.find(query).sort(sort).lean();
};

const findUnreadCount = async (userId) => {
  return Notification.countDocuments({ userId, read: false });
};

const markAsRead = async (userId, id) => {
  return Notification.findOneAndUpdate(
    { _id: id, userId },
    { $set: { read: true, readAt: new Date() } },
    { new: true }
  );
};

const markAllAsRead = async (userId) => {
  return Notification.updateMany(
    { userId, read: false },
    { $set: { read: true, readAt: new Date() } }
  );
};

const deleteNotification = async (userId, id) => {
  return Notification.findOneAndDelete({ _id: id, userId });
};

module.exports = {
  createNotification,
  findNotifications,
  findUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
