const Quiz = require('../../models/Quiz');
const QuizAttempt = require('../../models/QuizAttempt');

const createQuiz = async (data) => {
  return Quiz.create(data);
};

const findQuizById = async (id) => {
  return Quiz.findById(id)
    .populate('subjectId', 'name code color')
    .populate('topicId', 'name code description');
};

const findQuizzes = async (query = {}, sort = { createdAt: -1 }) => {
  return Quiz.find(query)
    .sort(sort)
    .populate('subjectId', 'name code color')
    .populate('topicId', 'name code description')
    .lean();
};

const createAttempt = async (data) => {
  return QuizAttempt.create(data);
};

const findAttemptById = async (id) => {
  return QuizAttempt.findById(id)
    .populate('quizId')
    .populate('userId', 'name email');
};

const findAttempts = async (query = {}, sort = { createdAt: -1 }) => {
  return QuizAttempt.find(query)
    .sort(sort)
    .populate('quizId')
    .populate('userId', 'name email')
    .lean();
};

const findLatestAttemptForQuiz = async (userId, quizId) => {
  return QuizAttempt.findOne({ userId, quizId }).sort({ createdAt: -1 });
};

module.exports = {
  createQuiz,
  findQuizById,
  findQuizzes,
  createAttempt,
  findAttemptById,
  findAttempts,
  findLatestAttemptForQuiz,
};
