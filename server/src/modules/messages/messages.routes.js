const express = require('express');
const { protect, authorizeRoles } = require('../auth/auth.middleware');
const {
  startConversationController,
  getConversationsController,
  getMessagesController,
  sendMessageController,
  markAsReadController,
} = require('./messages.controller');

const router = express.Router();

const generalAccess = [protect, authorizeRoles('Student', 'Mentor', 'Admin')];

router.post('/start', ...generalAccess, startConversationController);
router.get('/conversations', ...generalAccess, getConversationsController);
router.get('/:conversationId', ...generalAccess, getMessagesController);
router.post('/', ...generalAccess, sendMessageController);
router.patch('/read/:conversationId', ...generalAccess, markAsReadController);

module.exports = router;
