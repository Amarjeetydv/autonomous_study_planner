const mentorsRepository = require('./mentors.repository');
const User = require('../../models/User');
const Goal = require('../../models/Goal');
const DailyTask = require('../../models/DailyTask');
const Streak = require('../../models/Streak');
const KnowledgeMastery = require('../../models/KnowledgeMastery');
const QuizAttempt = require('../../models/QuizAttempt');
const Calendar = require('../../models/CalendarEvent');
const UserAchievement = require('../../models/UserAchievement');
const notificationsService = require('../notifications/notifications.service');
const AppError = require('../../utils/errors/AppError');

const requestMentorLink = async ({ studentId, mentorId }) => {
  const mentor = await User.findById(mentorId);
  if (!mentor || mentor.role !== 'Mentor') {
    throw new AppError('Specified user is not a verified Mentor', 404);
  }

  return mentorsRepository.createRequest({
    mentorId,
    studentId,
    status: 'pending',
  });
};

const acceptStudentRequest = async ({ mentorId, studentId }) => {
  const link = await mentorsRepository.findLink(mentorId, studentId);
  if (!link) {
    throw new AppError('Link request not found', 404);
  }

  const updated = await mentorsRepository.updateStatus(mentorId, studentId, 'accepted');

  const mentor = await User.findById(mentorId);
  await notificationsService.triggerNotification({
    userId: studentId,
    type: 'System Notification',
    title: 'Collaboration Accepted',
    message: `Mentor ${mentor ? mentor.name : 'Supervisor'} has accepted your study supervision link!`,
    priority: 'High',
  });

  return updated;
};

const rejectStudentRequest = async ({ mentorId, studentId }) => {
  const link = await mentorsRepository.findLink(mentorId, studentId);
  if (!link) {
    throw new AppError('Link request not found', 404);
  }

  return mentorsRepository.updateStatus(mentorId, studentId, 'rejected');
};

const getAssignedStudents = async (mentorId) => {
  return mentorsRepository.findStudentsForMentor(mentorId);
};

const getStudentDetail = async ({ mentorId, studentId }) => {
  // Validate link status
  const link = await mentorsRepository.findLink(mentorId, studentId);
  if (!link || link.status !== 'accepted') {
    throw new AppError('Unauthorized access to this student profile metrics', 403);
  }

  // Compile student parameters
  const goal = await Goal.findOne({ studentId, status: 'active' });
  const tasks = await DailyTask.find({ userId: studentId }).lean();
  const streak = await Streak.findOne({ studentId }).lean();
  const mastery = await KnowledgeMastery.find({ userId: studentId })
    .populate('subjectId', 'name code color')
    .populate('topicId', 'name')
    .lean();
  const quizzes = await QuizAttempt.find({ userId: studentId }).populate('quizId').lean();
  const calendar = await Calendar.find({ userId: studentId }).lean();
  const achievements = await UserAchievement.find({ userId: studentId }).populate('achievementId').lean();
  const feedback = await mentorsRepository.findFeedbackForStudent(studentId);

  return {
    studentId,
    goal,
    tasksCount: tasks.length,
    completedTasksCount: tasks.filter(t => t.status === 'Completed').length,
    streak: streak ? streak.currentStreak : 0,
    mastery,
    quizzes,
    calendar,
    achievements,
    feedback,
  };
};

const leaveFeedback = async ({ mentorId, data }) => {
  const { studentId, goalId, planId, taskId, comment, rating } = data;

  const link = await mentorsRepository.findLink(mentorId, studentId);
  if (!link || link.status !== 'accepted') {
    throw new AppError('Unauthorized connection link for this feedback request', 403);
  }

  const feedback = await mentorsRepository.createFeedback({
    mentorId,
    studentId,
    goalId,
    planId,
    taskId: taskId || null,
    comment,
    rating,
  });

  const mentor = await User.findById(mentorId);
  await notificationsService.triggerNotification({
    userId: studentId,
    type: 'AI Recommendation', // mapping mentor feedback as critical advice
    title: 'New Mentor Feedback',
    message: `Mentor ${mentor ? mentor.name : 'Supervisor'} left progress comments on your study plan.`,
    priority: 'Medium',
    relatedEntityType: 'MentorFeedback',
    relatedEntityId: feedback._id,
  });

  return feedback;
};

const getFeedbackList = async (studentId) => {
  return mentorsRepository.findFeedbackForStudent(studentId);
};

module.exports = {
  requestMentorLink,
  acceptStudentRequest,
  rejectStudentRequest,
  getAssignedStudents,
  getStudentDetail,
  leaveFeedback,
  getFeedbackList,
};
