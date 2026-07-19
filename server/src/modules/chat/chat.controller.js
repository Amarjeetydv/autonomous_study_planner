const asyncHandler = require('../../middlewares/asyncHandler');
const { sendResponse } = require('../../utils/response');
const chatService = require('./chat.service');

const sendMessageController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { conversationId, message } = req.body;

  const reply = await chatService.sendMessage({ userId, conversationId, message });

  return sendResponse(res, {
    success: true,
    message: 'AI reply generated successfully',
    data: { reply },
    errors: [],
  });
});

const getHistoryController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const history = await chatService.getHistory(userId);

  return sendResponse(res, {
    success: true,
    message: 'AI conversation threads list retrieved successfully',
    data: { history },
    errors: [],
  });
});

const getConversationController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const conversation = await chatService.getConversation(userId, req.params.conversationId);

  return sendResponse(res, {
    success: true,
    message: 'AI conversation thread details retrieved successfully',
    data: { conversation },
    errors: [],
  });
});

const deleteConversationController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  await chatService.deleteConversation(userId, req.params.conversationId);

  return sendResponse(res, {
    success: true,
    message: 'AI conversation thread deleted successfully',
    data: {},
    errors: [],
  });
});

module.exports = {
  sendMessageController,
  getHistoryController,
  getConversationController,
  deleteConversationController,
};
