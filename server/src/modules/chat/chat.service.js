const chatRepository = require('./chat.repository');
const Goal = require('../../models/Goal');
const DailyTask = require('../../models/DailyTask');
const KnowledgeMastery = require('../../models/KnowledgeMastery');
const QuizAttempt = require('../../models/QuizAttempt');
const { runGeminiStage } = require('../aiPlanning/services/gemini.service');
const AppError = require('../../utils/errors/AppError');
const logger = require('../../config/logger');

const compileStudentContext = async (userId) => {
  try {
    const goal = await Goal.findOne({ studentId: userId, status: 'active' });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasks = await DailyTask.find({
      userId,
      scheduledDate: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
    });

    const completedTasksCount = tasks.filter(t => t.status === 'Completed').length;
    const pendingTasksCount = tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;

    const weakTopics = await KnowledgeMastery.find({ userId, masteryScore: { $lt: 50 } })
      .populate('topicId', 'name')
      .populate('subjectId', 'name')
      .limit(5);

    const revisionQueue = await KnowledgeMastery.find({ userId, nextRevisionDate: { $lte: new Date() } });

    const latestQuiz = await QuizAttempt.findOne({ userId })
      .sort({ createdAt: -1 })
      .populate('quizId', 'title');

    return {
      goalTitle: goal ? goal.title : 'General Study Goal',
      goalType: goal ? goal.targetExam : 'General',
      targetDate: goal ? goal.targetDate.toLocaleDateString() : 'N/A',
      dailyHours: goal ? goal.dailyStudyHours : 0,
      completedTasksCount,
      pendingTasksCount,
      weakTopics: weakTopics.map(wt => `${wt.topicId?.name || wt.subjectId?.name} (${wt.masteryScore}% mastery)`),
      revisionQueueCount: revisionQueue.length,
      latestQuizAccuracy: latestQuiz ? latestQuiz.accuracy : 0,
      goalId: goal ? goal._id : null,
    };
  } catch (err) {
    logger.error('Failed to compile student context for AI study companion chat', { error: err.message });
    return {
      goalTitle: 'General Study Goal',
      goalType: 'General',
      targetDate: 'N/A',
      dailyHours: 0,
      completedTasksCount: 0,
      pendingTasksCount: 0,
      weakTopics: [],
      revisionQueueCount: 0,
      latestQuizAccuracy: 0,
      goalId: null,
    };
  }
};

const sendMessage = async ({ userId, conversationId, message }) => {
  const context = await compileStudentContext(userId);

  const systemPrompt = `
You are the "AI Study Companion" for StudyPilot, a personalized learning assistant.
You must analyze the user's specific learning context and guide their studies. Refer to their context naturally when appropriate.

STUDENT ACADEMIC CONTEXT:
Active Goal: "${context.goalTitle}" (${context.goalType} exam)
Target Date: ${context.targetDate}
Allocated Hours: ${context.dailyHours} hours/day
Today's Tasks: ${context.completedTasksCount} completed, ${context.pendingTasksCount} remaining
Weak Topics (Mastery < 50%): ${context.weakTopics.length > 0 ? context.weakTopics.join(', ') : 'None identified'}
Overdue spaced repetitions: ${context.revisionQueueCount} topics
Latest Diagnostic Accuracy: ${context.latestQuizAccuracy}%

CAPABILITIES:
- Explain concepts using active recall analogies.
- Recommend study blocks, target topics, and revision spacing logic.
- Motivate study consistency.
- Explain mistakes and suggest scheduling options without modifying data.

Format output using clean markdown (support lists, bold, italics, tables, and code snippets). Do not return JSON. Write standard markdown text. Keep responses conversational, concise, and highly supportive.
`;

  // Fetch thread history
  const history = await chatRepository.findByConversationId(userId, conversationId);

  // Map thread history to Gemini multi-turn format
  const contents = history.map(item => ({
    role: item.role === 'user' ? 'user' : 'model',
    parts: [{ text: item.message }]
  }));

  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  try {
    // Save user message log
    await chatRepository.createMessage({
      userId,
      conversationId,
      role: 'user',
      message,
      referencedGoalId: context.goalId,
    });

    // Run Gemini
    const geminiRes = await runGeminiStage({
      stage: 'AIStudyCompanionChat',
      systemPrompt,
      userPrompt: contents,
      temperature: 0.7,
      responseMimeType: 'text/plain',
    });

    const aiMessage = geminiRes.text.trim();

    // Save AI response message log
    const savedAI = await chatRepository.createMessage({
      userId,
      conversationId,
      role: 'assistant',
      message: aiMessage,
      referencedGoalId: context.goalId,
      contextSummary: JSON.stringify(context),
    });

    return savedAI;
  } catch (err) {
    logger.error('Failed to run AI Study Companion message generation', { error: err.message });
    throw new AppError('AI Study Companion failed to generate response. Please try again.', 500);
  }
};

const getHistory = async (userId) => {
  return chatRepository.findHistory(userId);
};

const getConversation = async (userId, conversationId) => {
  return chatRepository.findByConversationId(userId, conversationId);
};

const deleteConversation = async (userId, conversationId) => {
  return chatRepository.deleteConversation(userId, conversationId);
};

module.exports = {
  sendMessage,
  getHistory,
  getConversation,
  deleteConversation,
};
