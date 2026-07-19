const asyncHandler = require('../../middlewares/asyncHandler');
const { sendResponse } = require('../../utils/response');
const quizzesService = require('./quizzes.service');

const generateQuizController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { subjectId, topicId, difficulty, count } = req.body;

  const quiz = await quizzesService.generateQuiz({ 
    userId, 
    subjectId, 
    topicId, 
    difficulty, 
    count 
  });

  return sendResponse(res, {
    success: true,
    message: 'AI diagnostic quiz generated successfully',
    data: { quiz },
    errors: [],
  }, 201);
});

const submitQuizAttemptController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const quizId = req.params.quizId;
  const { answers, completionTime } = req.body;

  const attempt = await quizzesService.submitQuizAttempt({ 
    userId, 
    quizId, 
    answers, 
    completionTime 
  });

  return sendResponse(res, {
    success: true,
    message: 'Quiz attempt evaluated and logged successfully',
    data: { attempt },
    errors: [],
  });
});

const listQuizzesController = asyncHandler(async (req, res) => {
  const quizzes = await quizzesService.listQuizzes(req.query);

  return sendResponse(res, {
    success: true,
    message: 'Quizzes list retrieved successfully',
    data: { quizzes },
    errors: [],
  });
});

const getQuizDetailController = asyncHandler(async (req, res) => {
  const quiz = await quizzesService.getQuizDetail(req.params.quizId);

  return sendResponse(res, {
    success: true,
    message: 'Quiz detail retrieved successfully',
    data: { quiz },
    errors: [],
  });
});

const listUserAttemptsController = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const attempts = await quizzesService.listUserAttempts(userId);

  return sendResponse(res, {
    success: true,
    message: 'Quiz attempts history retrieved successfully',
    data: { attempts },
    errors: [],
  });
});

const getAttemptDetailController = asyncHandler(async (req, res) => {
  const attempt = await quizzesService.getAttemptDetail(req.params.attemptId);

  return sendResponse(res, {
    success: true,
    message: 'Attempt detail retrieved successfully',
    data: { attempt },
    errors: [],
  });
});

module.exports = {
  generateQuizController,
  submitQuizAttemptController,
  listQuizzesController,
  getQuizDetailController,
  listUserAttemptsController,
  getAttemptDetailController,
};
