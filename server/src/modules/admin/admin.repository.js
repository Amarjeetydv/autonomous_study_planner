const User = require('../../models/User');
const Goal = require('../../models/Goal');
const AIPlan = require('../../models/AIPlan');
const DailyTask = require('../../models/DailyTask');
const QuizAttempt = require('../../models/QuizAttempt');
const Notification = require('../../models/Notification');
const AdminAuditLog = require('../../models/AdminAuditLog');
const Subject = require('../../models/Subject');
const Topic = require('../../models/Topic');
const Subtopic = require('../../models/Subtopic');
const PlanningJob = require('../../models/PlanningJob');

const findUsers = async (filter = {}) => {
  return User.find(filter).select('-password').lean();
};

const findUserById = async (id) => {
  return User.findById(id).select('-password');
};

const updateUser = async (id, data) => {
  return User.findByIdAndUpdate(id, { $set: data }, { new: true }).select('-password');
};

const deleteUser = async (id) => {
  return User.findByIdAndDelete(id);
};

const logAudit = async (data) => {
  return AdminAuditLog.create(data);
};

const findAuditLogs = async () => {
  return AdminAuditLog.find()
    .populate('adminId', 'name email')
    .sort({ createdAt: -1 })
    .lean();
};

const getSystemStats = async () => {
  const usersCount = await User.countDocuments();
  const studentsCount = await User.countDocuments({ role: 'Student' });
  const mentorsCount = await User.countDocuments({ role: 'Mentor' });
  const goalsCount = await Goal.countDocuments();
  const plansCount = await AIPlan.countDocuments();
  const quizzesCount = await QuizAttempt.countDocuments();
  const notificationsCount = await Notification.countDocuments();
  const jobsCount = await PlanningJob.countDocuments();
  const failedJobsCount = await PlanningJob.countDocuments({ status: 'failed' });

  // Quiz averages
  const quizAttempts = await QuizAttempt.find().select('accuracy score').lean();
  const avgAccuracy = quizAttempts.length > 0 
    ? Math.round(quizAttempts.reduce((acc, a) => acc + a.accuracy, 0) / quizAttempts.length)
    : 0;

  // Study hours
  const completedTasks = await DailyTask.find({ status: 'Completed' }).select('actualStudyTime').lean();
  const totalStudyHours = completedTasks.reduce((acc, t) => acc + (t.actualStudyTime || 0), 0) / 60;
  const avgStudyHours = completedTasks.length > 0
    ? Math.round((totalStudyHours / completedTasks.length) * 100) / 100
    : 0;

  return {
    kpis: {
      totalUsers: usersCount,
      activeStudents: studentsCount,
      activeMentors: mentorsCount,
      goalsCreated: goalsCount,
      plansGenerated: plansCount,
      quizzesAttempted: quizzesCount,
      notificationsDispatched: notificationsCount,
      avgQuizAccuracy: avgAccuracy,
      averageStudyHoursPerTask: avgStudyHours
    },
    aiPlanner: {
      totalJobs: jobsCount,
      failedJobs: failedJobsCount,
      activeJobs: jobsCount - failedJobsCount
    }
  };
};

module.exports = {
  findUsers,
  findUserById,
  updateUser,
  deleteUser,
  logAudit,
  findAuditLogs,
  getSystemStats,
};
