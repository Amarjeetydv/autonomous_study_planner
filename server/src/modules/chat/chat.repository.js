const ChatConversation = require('../../models/ChatConversation');

const createMessage = async (data) => {
  return ChatConversation.create(data);
};

const findHistory = async (userId) => {
  // Return unique conversationIds with their latest message
  return ChatConversation.aggregate([
    { $match: { userId } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$conversationId',
        latestMessage: { $first: '$message' },
        role: { $first: '$role' },
        timestamp: { $first: '$createdAt' },
      }
    },
    { $sort: { timestamp: -1 } }
  ]);
};

const findByConversationId = async (userId, conversationId) => {
  return ChatConversation.find({ userId, conversationId }).sort({ createdAt: 1 });
};

const deleteConversation = async (userId, conversationId) => {
  return ChatConversation.deleteMany({ userId, conversationId });
};

module.exports = {
  createMessage,
  findHistory,
  findByConversationId,
  deleteConversation,
};
