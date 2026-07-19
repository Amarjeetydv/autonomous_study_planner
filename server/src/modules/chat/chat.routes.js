const express = require('express');
const { protect, authorizeRoles } = require('../auth/auth.middleware');
const validateRequest = require('../../middlewares/validateRequest.middleware');
const {
  sendMessageController,
  getHistoryController,
  getConversationController,
  deleteConversationController,
} = require('./chat.controller');
const {
  sendMessageValidators,
  conversationIdParamValidator,
} = require('./chat.validators');

const router = express.Router();

const chatAccess = [protect, authorizeRoles('Student', 'Admin')];

router.post('/message', ...chatAccess, sendMessageValidators, validateRequest, sendMessageController);
router.get('/history', ...chatAccess, getHistoryController);
router.get('/conversation/:conversationId', ...chatAccess, conversationIdParamValidator, validateRequest, getConversationController);
router.delete('/conversation/:conversationId', ...chatAccess, conversationIdParamValidator, validateRequest, deleteConversationController);

module.exports = router;
