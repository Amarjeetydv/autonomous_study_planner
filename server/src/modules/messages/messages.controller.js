const asyncHandler = require('../../middlewares/asyncHandler');
const { sendResponse } = require('../../utils/response');
const messagesService = require('./messages.service');

const startConversationController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { mentorId, studentId } = req.body;

  const conversation = await messagesService.startConversation({ userId, mentorId, studentId });

  return sendResponse(res, {
    success: true,
    message: 'Chat conversation initialized',
    data: { conversation },
    errors: [],
  }, 201);
});

const getConversationsController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const conversations = await messagesService.getConversations(userId);

  return sendResponse(res, {
    success: true,
    message: 'Conversations list retrieved successfully',
    data: { conversations },
    errors: [],
  });
});

const getMessagesController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { conversationId } = req.params;

  const messages = await messagesService.getMessages({ conversationId, userId });

  return sendResponse(res, {
    success: true,
    message: 'Messages thread retrieved successfully',
    data: { messages },
    errors: [],
  });
});

const sendMessageController = asyncHandler(async (req, res) => {
  const senderId = req.user._id || req.user.id;
  const { conversationId, receiverId, message } = req.body;

  const messageDoc = await messagesService.sendMessage({
    conversationId,
    senderId,
    receiverId,
    messageText: message,
  });

  return sendResponse(res, {
    success: true,
    message: 'Message dispatched successfully',
    data: { message: messageDoc },
    errors: [],
  }, 201);
});

const markAsReadController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { conversationId } = req.params;

  await messagesService.markAsRead({ conversationId, userId });

  return sendResponse(res, {
    success: true,
    message: 'Messages marked as read',
    data: {},
    errors: [],
  });
});

module.exports = {
  startConversationController,
  getConversationsController,
  getMessagesController,
  sendMessageController,
  markAsReadController,
};
