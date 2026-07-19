const mongoose = require('mongoose');

const chatConversationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, index: true },
    conversationId: { type: String, required: true, index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    message: { type: String, required: true },
    referencedGoalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goals', default: null },
    referencedPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'AIPlans', default: null },
    contextSummary: { type: String, default: '' },
  },
  { timestamps: true, collection: 'ChatConversations' }
);

module.exports = mongoose.model('ChatConversation', chatConversationSchema);
