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
const StudyPlan = require('../../models/StudyPlan');
const Mentor = require('../../models/Mentor');

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

  // Synchronize relationship in Mentor document array
  await Mentor.findOneAndUpdate(
    { userId: mentorId },
    { $addToSet: { studentsAssigned: studentId } }
  );

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
  const user = await User.findById(mentorId).lean();
  const isAdmin = user && user.roles && user.roles.includes('Admin');

  if (!isAdmin) {
    const link = await mentorsRepository.findLink(mentorId, studentId);
    if (!link || link.status !== 'accepted') {
      throw new AppError('Unauthorized access to this student profile metrics', 403);
    }
  }

  // Compile student parameters
  const goal = await Goal.findOne({ studentId, status: 'active' }).lean();
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
  const { studentId, goalId, planId, taskId, comment, rating, strengths, weaknesses, recommendations, deadlineSuggestions } = data;

  const user = await User.findById(mentorId).lean();
  const isAdmin = user && user.roles && user.roles.includes('Admin');

  if (!isAdmin) {
    const link = await mentorsRepository.findLink(mentorId, studentId);
    if (!link || link.status !== 'accepted') {
      throw new AppError('Unauthorized connection link for this feedback request', 403);
    }
  }

  let finalGoalId = goalId;
  let finalPlanId = planId;
  if (!finalGoalId) {
    const activeGoal = await Goal.findOne({ studentId, status: 'active' }).lean();
    finalGoalId = activeGoal ? activeGoal._id : null;
  }
  if (!finalPlanId && finalGoalId) {
    const activePlan = await StudyPlan.findOne({ goalId: finalGoalId }).lean();
    finalPlanId = activePlan ? activePlan._id : null;
  }

  const feedback = await mentorsRepository.createFeedback({
    mentorId,
    studentId,
    goalId: finalGoalId,
    planId: finalPlanId,
    taskId: taskId || null,
    comment: comment || '',
    rating: rating || 5,
    strengths: strengths || '',
    weaknesses: weaknesses || data.weakAreas || '',
    recommendations: recommendations || '',
    deadlineSuggestions: deadlineSuggestions || '',
  });

  const mentor = await User.findById(mentorId);
  await notificationsService.triggerNotification({
    userId: studentId,
    type: 'System Notification',
    title: 'Mentor Left Feedback',
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

const getAvailableMentors = async () => {
  return mentorsRepository.findAvailableMentors();
};

const getConnectedMentorForStudent = async (studentId) => {
  return mentorsRepository.findConnectedMentorForStudent(studentId);
};

const getPendingLinkForStudent = async (studentId) => {
  return mentorsRepository.findPendingLinkForStudent(studentId);
};

const inviteMentor = async ({ studentId, email, mentorId }) => {
  let targetMentorId = mentorId;
  
  if (email) {
    // Make regex search for email to be case-insensitive and robust
    const mentorUser = await User.findOne({ 
      email: { $regex: new RegExp(`^${email.trim()}$`, 'i') }, 
      roles: { $in: ['Mentor'] } 
    }).lean();
    if (!mentorUser) {
      throw new AppError('No verified mentor account exists with this email address.', 404);
    }
    targetMentorId = mentorUser._id;
  }

  if (!targetMentorId) {
    throw new AppError('Mentor identity parameters are required.', 400);
  }

  const existing = await mentorsRepository.findLink(targetMentorId, studentId);
  if (existing) {
    if (existing.status === 'accepted') {
      throw new AppError('You are already linked to this mentor!', 400);
    }
    return existing;
  }

  return mentorsRepository.createRequest({
    mentorId: targetMentorId,
    studentId,
    status: 'pending',
  });
};

const requestReview = async (studentId) => {
  const link = await mentorsRepository.findConnectedMentorForStudent(studentId);
  if (!link || !link.mentorId) {
    throw new AppError('No connected mentor found to request a review from.', 404);
  }

  const student = await User.findById(studentId).lean();
  await notificationsService.triggerNotification({
    userId: link.mentorId._id,
    type: 'System Notification',
    title: 'Review Requested',
    message: `Student ${student ? student.name : 'Learner'} requested a review of their study plan progress.`,
    priority: 'High',
  });

  return { success: true };
};

const getPendingRequests = async (mentorId) => {
  return mentorsRepository.findPendingRequestsForMentor(mentorId);
};

module.exports = {
  requestMentorLink,
  acceptStudentRequest,
  rejectStudentRequest,
  getAssignedStudents,
  getStudentDetail,
  leaveFeedback,
  getFeedbackList,
  getAvailableMentors,
  getConnectedMentorForStudent,
  getPendingLinkForStudent,
  inviteMentor,
  requestReview,
  getPendingRequests,
};
