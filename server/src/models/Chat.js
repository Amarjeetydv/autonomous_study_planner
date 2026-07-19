const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    participantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true }],
    threadType: { type: String, enum: ['direct', 'group', 'mentorSupport'], default: 'direct' },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    lastMessage: {
      text: { type: String },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
      sentAt: { type: Date },
    },
    lastMessageAt: { type: Date },
    unreadCount: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'muted', 'archived'], default: 'active' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'Chat' }
);

module.exports = mongoose.model('Chat', chatSchema);
