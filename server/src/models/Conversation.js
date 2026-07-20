const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true }],
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    lastMessage: {
      text: { type: String, default: '' },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
      sentAt: { type: Date, default: Date.now },
    },
    unreadCountStudent: { type: Number, default: 0 },
    unreadCountMentor: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'Conversations' }
);

conversationSchema.index({ studentId: 1, mentorId: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);
