const express = require('express');
const { protect, authorizeRoles } = require('../auth/auth.middleware');
const validateRequest = require('../../middlewares/validateRequest.middleware');
const {
  generateQuizController,
  submitQuizAttemptController,
  listQuizzesController,
  getQuizDetailController,
  listUserAttemptsController,
  getAttemptDetailController,
} = require('./quizzes.controller');
const {
  generateQuizValidators,
  submitAttemptValidators,
  quizIdParamValidator,
  attemptIdParamValidator,
} = require('./quizzes.validators');

const router = express.Router();

const quizzesAccess = [protect, authorizeRoles('Student', 'Admin')];

router.post('/generate', ...quizzesAccess, generateQuizValidators, validateRequest, generateQuizController);
router.post('/:quizId/submit', ...quizzesAccess, quizIdParamValidator, submitAttemptValidators, validateRequest, submitQuizAttemptController);
router.get('/', ...quizzesAccess, listQuizzesController);
router.get('/attempts/history', ...quizzesAccess, listUserAttemptsController);
router.get('/attempts/:attemptId', ...quizzesAccess, attemptIdParamValidator, validateRequest, getAttemptDetailController);
router.get('/:quizId', ...quizzesAccess, quizIdParamValidator, validateRequest, getQuizDetailController);

module.exports = router;
