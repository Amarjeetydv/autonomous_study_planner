const quizzesRepository = require('./quizzes.repository');
const Subject = require('../../models/Subject');
const Topic = require('../../models/Topic');
const Goal = require('../../models/Goal');
const KnowledgeMastery = require('../../models/KnowledgeMastery');
const AppError = require('../../utils/errors/AppError');
const logger = require('../../config/logger');
const { runGeminiStage } = require('../aiPlanning/services/gemini.service');

const GENERATOR_SYSTEM_PROMPT = `
You are the "AI Diagnostic Quiz Generator" for the Autonomous Study Planner.
Your role is to generate custom diagnostic study quiz questions for a student based on topic outline.
Generate a mix of Multiple Choice (mcq), True/False (tf), and Fill in the Blank (fib) questions.

Format response in valid JSON matching this schema:
{
  "title": "String (Descriptive quiz title)",
  "questions": [
    {
      "questionText": "String",
      "questionType": "mcq | tf | fib",
      "options": [
        { "label": "String (Required for mcq and tf)", "isCorrect": true }
      ],
      "explanation": "String (Explanation why the answer is correct)",
      "marks": 1
    }
  ]
}
For True/False, specify "True" and "False" options. For Fill in the Blank, specify options containing only 1 item which is the correct word/phrase.
Generate exactly the requested count of questions. Do not wrap in markdown tags. Only output raw JSON.
`;

const EVALUATOR_SYSTEM_PROMPT = `
You are the "AI Quiz Diagnostician".
Your job is to read a student's graded quiz attempt results and provide feedback.
Analyze correct/incorrect counts, accuracy, and topic names to identify weak sub-concepts and recommend revision steps.

You must respond in valid JSON matching this schema:
{
  "feedback": "String (Compelling performance summary & motivational insights)",
  "weakConcepts": ["String (list of weak topic sub-aspects to review)"],
  "recommendedRevision": ["String (list of actionable steps to study)"],
  "nextDifficulty": "Easy | Medium | Hard (recommended level for next quiz)"
}
Only output raw JSON.
`;

const generateQuiz = async ({ userId, subjectId, topicId, difficulty = 'Medium', count = 5 }) => {
  let goal = await Goal.findOne({ studentId: userId, isCurrent: true }).lean();
  if (!goal) {
    goal = await Goal.findOne({ studentId: userId, status: { $ne: 'archived' } }).sort({ createdAt: -1 }).lean();
  }

  let targetSubjectId = (typeof subjectId === 'object' && subjectId !== null) ? (subjectId._id || subjectId.id) : subjectId;
  
  if (!targetSubjectId && goal && goal.selectedSubjects && goal.selectedSubjects.length > 0) {
    const firstSub = goal.selectedSubjects[0];
    targetSubjectId = (typeof firstSub === 'object' && firstSub !== null) ? (firstSub._id || firstSub.id) : firstSub;
  }

  if (!targetSubjectId) {
    const firstSub = await Subject.findOne().lean();
    if (firstSub) targetSubjectId = firstSub._id;
  }

  const subject = targetSubjectId ? await Subject.findById(targetSubjectId) : null;
  const topic = (topicId && typeof topicId !== 'object') ? await Topic.findById(topicId) : null;

  const subjectName = subject ? subject.name : 'General Computer Science';
  const topicName = topic ? topic.name : 'Core Concepts';

  const userPrompt = `
  SUBJECT: ${subjectName}
  TOPIC: ${topicName}
  DIFFICULTY LEVEL: ${difficulty}
  QUESTION COUNT: ${count}
  `;

  try {
    const response = await runGeminiStage({
      stage: 'GenerateQuiz',
      systemPrompt: GENERATOR_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.5,
    });

    const parsed = JSON.parse(response.text);

    return quizzesRepository.createQuiz({
      title: parsed.title || `${topicName} Practice Quiz`,
      description: `Diagnostic AI Quiz generated for ${topicName} (${difficulty})`,
      subjectId,
      topicId: topicId || null,
      goalId: goal._id,
      createdBy: userId,
      difficulty,
      estimatedTime: count * 3, // 3 minutes per question
      generatedByAI: true,
      questions: parsed.questions || [],
    });
  } catch (err) {
    logger.error('Failed to generate diagnostic quiz using AI', { error: err.message });
    throw new AppError('Failed to generate study questions. Please try again.', 500);
  }
};

const submitQuizAttempt = async ({ userId, quizId, answers, completionTime }) => {
  const quiz = await quizzesRepository.findQuizById(quizId);
  if (!quiz) {
    throw new AppError('Quiz not found', 404);
  }

  const totalQuestions = quiz.questions.length;
  if (totalQuestions === 0) {
    throw new AppError('Invalid quiz layout containing no questions', 400);
  }

  let correctAnswers = 0;
  let incorrectAnswers = 0;
  let skippedAnswers = 0;
  let score = 0;

  const gradedAnswers = quiz.questions.map((q, idx) => {
    const userAns = answers.find(a => a.questionIndex === idx);
    if (!userAns || userAns.answer === undefined || userAns.answer === '') {
      skippedAnswers += 1;
      return {
        questionIndex: idx,
        answer: '',
        isCorrect: false,
      };
    }

    // Match answer option index or text
    const correctOption = q.options.find(opt => opt.isCorrect);
    const correctLabel = correctOption ? correctOption.label.trim().toLowerCase() : '';
    const givenLabel = String(userAns.answer).trim().toLowerCase();

    const isMatch = correctLabel === givenLabel;

    if (isMatch) {
      correctAnswers += 1;
      score += q.marks || 1;
    } else {
      incorrectAnswers += 1;
    }

    return {
      questionIndex: idx,
      answer: userAns.answer,
      isCorrect: isMatch,
    };
  });

  const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
  const timePerQuestion = Math.round(completionTime / totalQuestions);

  // Trigger AI evaluation feedback
  let evaluation = {
    feedback: 'Log submission complete.',
    weakConcepts: [],
    recommendedRevision: [],
    nextDifficulty: 'Medium',
  };

  try {
    const evalUserPrompt = `
    QUIZ: "${quiz.title}"
    TOTAL QUESTIONS: ${totalQuestions}
    CORRECT: ${correctAnswers}
    INCORRECT: ${incorrectAnswers}
    ACCURACY: ${accuracy}%
    TIME TAKEN: ${completionTime} seconds
    `;

    const response = await runGeminiStage({
      stage: 'EvaluateQuiz',
      systemPrompt: EVALUATOR_SYSTEM_PROMPT,
      userPrompt: evalUserPrompt,
      temperature: 0.2,
    });

    const parsed = JSON.parse(response.text);
    evaluation = {
      feedback: parsed.feedback || evaluation.feedback,
      weakConcepts: parsed.weakConcepts || [],
      recommendedRevision: parsed.recommendedRevision || [],
      nextDifficulty: parsed.nextDifficulty || 'Medium',
    };
  } catch (err) {
    logger.error('Failed to trigger AI feedback loop evaluation on quiz submit', { error: err.message });
  }

  // Fetch old mastery score
  let oldScore = 0;
  const mastery = await KnowledgeMastery.findOne({ userId, subjectId: quiz.subjectId, topicId: quiz.topicId });
  if (mastery) {
    oldScore = mastery.masteryScore;
  }

  // Update Knowledge Mastery
  const masteryService = require('../mastery/mastery.service');
  const updatedMastery = await masteryService.updateMastery({
    userId,
    data: {
      subjectId: quiz.subjectId,
      topicId: quiz.topicId,
      quizScore: accuracy,
      actionType: 'quiz_attempt',
    }
  });

  const newScore = updatedMastery ? updatedMastery.masteryScore : oldScore;

  // Trigger Adaptive Scheduler if score is poor (< 60)
  if (accuracy < 60) {
    try {
      const schedulerService = require('../scheduler/scheduler.service');
      await schedulerService.recalculateSchedule({ 
        studentId: userId, 
        triggerEvent: 'task_missed' 
      });
      logger.info(`Auto-triggered schedule recalculations due to quiz failure (accuracy: ${accuracy}%) for user ${userId}`);
    } catch (err) {
      logger.error('Failed to trigger auto rescheduling on quiz failure', { error: err.message });
    }
  }

  // Create attempt log
  const attempt = await quizzesRepository.createAttempt({
    userId,
    quizId,
    score,
    accuracy,
    completionTime,
    timePerQuestion,
    correctAnswers,
    incorrectAnswers,
    skippedAnswers,
    weakConcepts: evaluation.weakConcepts,
    aiFeedback: evaluation.feedback,
    masteryChanges: {
      oldScore,
      newScore,
    },
    answers: gradedAnswers,
  });

  try {
    const gamificationService = require('../gamification/gamification.service');
    await gamificationService.addXP(userId, accuracy === 100 ? 700 : 200, 'Quiz Completed');
    await gamificationService.evaluateAchievements(userId, 'quiz_completed', 1);
    if (accuracy === 100) {
      await gamificationService.evaluateAchievements(userId, 'quiz_perfect', 1);
    }
  } catch (err) {
    logger.error('Failed to trigger gamification updates on quiz attempt submission success', { error: err.message });
  }

  return attempt;
};

const getQuizDetail = async (quizId) => {
  return quizzesRepository.findQuizById(quizId);
};

const listQuizzes = async (query = {}) => {
  return quizzesRepository.findQuizzes(query);
};

const getAttemptDetail = async (attemptId) => {
  return quizzesRepository.findAttemptById(attemptId);
};

const listUserAttempts = async (userId) => {
  return quizzesRepository.findAttempts({ userId });
};

module.exports = {
  generateQuiz,
  submitQuizAttempt,
  getQuizDetail,
  listQuizzes,
  getAttemptDetail,
  listUserAttempts,
};
