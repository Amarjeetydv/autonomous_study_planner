const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, index: true },
    type: {
      type: String,
      enum: [
        'Study Reminder', 'Revision Reminder', 'Quiz Reminder', 
        'Daily Check-in Reminder', 'Goal Deadline Reminder', 
        'Adaptive Schedule Update', 'Achievement Earned', 
        'AI Recommendation', 'System Notification'
      ],
      default: 'System Notification'
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    read: { type: Boolean, default: false },
    scheduledTime: { type: Date, default: null },
    deliveredAt: { type: Date, default: Date.now },
    relatedEntityType: { type: String, default: '' },
    relatedEntityId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true, collection: 'Notifications' }
);

module.exports = mongoose.model('Notifications', notificationSchema);
