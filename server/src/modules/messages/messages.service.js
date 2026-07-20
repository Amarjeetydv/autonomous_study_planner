const Conversation = require('../../models/Conversation');
const Message = require('../../models/Message');
const User = require('../../models/User');
const notificationsService = require('../notifications/notifications.service');
const AppError = require('../../utils/errors/AppError');

const startConversation = async ({ userId, mentorId, studentId }) => {
  let targetStudentId = studentId;
  let targetMentorId = mentorId;

  const callingUser = await User.findById(userId).lean();
  if (callingUser && callingUser.roles && callingUser.roles.includes('Mentor')) {
    targetMentorId = userId;
  } else {
    targetStudentId = userId;
  }

  if (!targetStudentId || !targetMentorId) {
    throw new AppError('Both student and mentor identities are required to start a chat thread', 400);
  }

  let conversation = await Conversation.findOne({
    studentId: targetStudentId,
    mentorId: targetMentorId,
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [targetStudentId, targetMentorId],
      studentId: targetStudentId,
      mentorId: targetMentorId,
      lastMessage: {
        text: 'Conversation initialized',
        senderId: userId,
        sentAt: new Date(),
      },
    });
  }

  return conversation;
};

const getConversations = async (userId) => {
  const conversations = await Conversation.find({
    participants: userId,
  })
    .populate('participants', 'name email avatarUrl roles')
    .sort({ updatedAt: -1 })
    .lean();

  return conversations;
};

const getMessages = async ({ conversationId, userId }) => {
  const conversation = await Conversation.findById(conversationId).lean();
  if (!conversation) {
    throw new AppError('Conversation thread not found', 404);
  }

  if (!conversation.participants.some(p => p.toString() === userId.toString())) {
    throw new AppError('Unauthorized access to this conversation thread', 403);
  }

  const messages = await Message.find({ conversationId })
    .populate('senderId', 'name email avatarUrl')
    .sort({ createdAt: 1 })
    .lean();

  return messages;
};

const sendMessage = async ({ conversationId, senderId, receiverId, messageText }) => {
  let conversation;
  if (conversationId) {
    conversation = await Conversation.findById(conversationId);
  } else if (receiverId) {
    const sender = await User.findById(senderId).lean();
    const isMentor = sender.roles && sender.roles.includes('Mentor');
    const studentId = isMentor ? receiverId : senderId;
    const mentorId = isMentor ? senderId : receiverId;

    conversation = await Conversation.findOne({ studentId, mentorId });
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [studentId, mentorId],
        studentId,
        mentorId,
      });
    }
  }

  if (!conversation) {
    throw new AppError('Could not resolve conversation thread for this message', 400);
  }

  const actualReceiverId = receiverId || conversation.participants.find(p => p.toString() !== senderId.toString());

  const message = await Message.create({
    conversationId: conversation._id,
    senderId,
    receiverId: actualReceiverId,
    message: messageText,
    read: false,
  });

  conversation.lastMessage = {
    text: messageText,
    senderId,
    sentAt: new Date(),
  };

  const senderUser = await User.findById(senderId).lean();
  const isSenderMentor = senderUser.roles && senderUser.roles.includes('Mentor');

  if (isSenderMentor) {
    conversation.unreadCountStudent += 1;
  } else {
    conversation.unreadCountMentor += 1;
  }

  await conversation.save();

  const notificationTitle = isSenderMentor ? 'Mentor Replied' : 'New Message from Student';
  const notificationMsg = isSenderMentor
    ? `Mentor ${senderUser.name} sent you a message: "${messageText.slice(0, 40)}${messageText.length > 40 ? '...' : ''}"`
    : `Student ${senderUser.name} sent you a message: "${messageText.slice(0, 40)}${messageText.length > 40 ? '...' : ''}"`;

  await notificationsService.triggerNotification({
    userId: actualReceiverId,
    type: 'System Notification',
    title: notificationTitle,
    message: notificationMsg,
    priority: 'Medium',
    relatedEntityType: 'Message',
    relatedEntityId: message._id,
  });

  return message;
};

const markAsRead = async ({ conversationId, userId }) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return { success: true };

  await Message.updateMany(
    { conversationId, receiverId: userId, read: false },
    { $set: { read: true } }
  );

  const callingUser = await User.findById(userId).lean();
  const isMentor = callingUser.roles && callingUser.roles.includes('Mentor');

  if (isMentor) {
    conversation.unreadCountMentor = 0;
  } else {
    conversation.unreadCountStudent = 0;
  }

  await conversation.save();
  return { success: true };
};

module.exports = {
  startConversation,
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
};
