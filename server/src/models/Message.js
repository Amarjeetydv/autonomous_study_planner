const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversations', required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, index: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, index: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'Messages' }
);

module.exports = mongoose.model('Message', messageSchema);
