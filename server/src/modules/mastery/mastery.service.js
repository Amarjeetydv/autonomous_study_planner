const masteryRepository = require('./mastery.repository');
const Goal = require('../../models/Goal');
const Subject = require('../../models/Subject');
const Topic = require('../../models/Topic');
const AppError = require('../../utils/errors/AppError');
const logger = require('../../config/logger');

const calculateNewSpacedRepetition = (oldFactor, quizScore, confidenceScore) => {
  let factor = oldFactor || 1; // days
  
  if (quizScore !== undefined) {
    if (quizScore >= 80) {
      factor = factor * 2; // double half-life
    } else if (quizScore < 60) {
      factor = Math.max(1, factor / 2); // halve half-life
    }
  } else if (confidenceScore !== undefined) {
    if (confidenceScore >= 4) {
      factor = factor * 1.5;
    } else if (confidenceScore <= 2) {
      factor = Math.max(1, factor / 1.5);
    }
  }

  // Cap factor between 1 day and 30 days
  return Math.min(30, Math.max(1, factor));
};

const getAIRecommendation = (score, subjectName) => {
  if (score < 40) {
    return `Weak core concept baseline in ${subjectName}. Prioritize basic definitions and standard study blocks.`;
  }
  if (score < 70) {
    return `Moderate grasp of ${subjectName}. Schedule active spaced recall sessions and log diagnostic mock test quizzes.`;
  }
  return `Strong understanding of ${subjectName}. Engage in peer teaching or advanced mock exams to maintain long-term retention.`;
};

const updateMastery = async ({ userId, data }) => {
  const { subjectId, topicId, subtopicId, quizScore, confidenceScore, actionType = 'check_in' } = data;

  const goal = await Goal.findOne({ studentId: userId, status: 'active' });
  if (!goal) {
    throw new AppError('No active goal found to attach mastery progress', 404);
  }

  // Find subject details to formulate custom AI suggestion
  const subject = await Subject.findById(subjectId);
  const subjectName = subject ? subject.name : 'this subject';

  // Find or initialize existing record
  const query = { userId, subjectId };
  if (topicId) query.topicId = topicId;
  
  const existing = await masteryRepository.findOne(query);

  const oldMastery = existing ? existing.masteryScore : 0;
  const oldFactor = existing ? existing.forgettingCurveFactor : 1;
  const oldQuizAttempts = existing ? existing.quizAttempts : 0;
  const oldQuizSum = existing ? (existing.averageQuizScore * oldQuizAttempts) : 0;

  // Calculate new mastery score
  let newMastery = oldMastery;
  if (quizScore !== undefined) {
    newMastery = Math.round(oldMastery * 0.4 + quizScore * 0.6);
  } else if (confidenceScore !== undefined) {
    newMastery = Math.round(oldMastery * 0.8 + (confidenceScore * 20) * 0.2);
  }
  newMastery = Math.min(100, Math.max(0, newMastery));

  // Spaced repetition metrics
  const newFactor = calculateNewSpacedRepetition(oldFactor, quizScore, confidenceScore);
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + Math.round(newFactor));

  // Quiz statistics
  let newQuizAttempts = oldQuizAttempts;
  let newAvgScore = existing ? existing.averageQuizScore : 0;
  if (quizScore !== undefined) {
    newQuizAttempts += 1;
    newAvgScore = (oldQuizSum + quizScore) / newQuizAttempts;
  }

  const payload = {
    goalId: goal._id,
    subtopicId,
    masteryScore: newMastery,
    confidenceScore: confidenceScore || (existing ? existing.confidenceScore : 3),
    forgettingCurveFactor: newFactor,
    nextRevisionDate: nextDate,
    quizAttempts: newQuizAttempts,
    averageQuizScore: newAvgScore,
    estimatedRetention: 100, // resets on active study session
    aiRecommendation: getAIRecommendation(newMastery, subjectName),
  };

  if (actionType === 'check_in' || actionType === 'revision_completed') {
    payload.lastRevisionDate = new Date();
    payload.revisionCount = (existing ? existing.revisionCount : 0) + 1;
  }

  // Update
  return masteryRepository.upsert(userId, subjectId, topicId || null, payload);
};

const listMasteries = async (userId) => {
  return masteryRepository.find({ userId });
};

const getSubjectMastery = async (userId, subjectId) => {
  return masteryRepository.find({ userId, subjectId });
};

const getWeakTopics = async (userId) => {
  return masteryRepository.findWeakTopics(userId);
};

const getRevisionQueue = async (userId) => {
  return masteryRepository.findRevisionQueue(userId);
};

// Hook trigger from Daily Check-ins submission
const triggerMasteryUpdateFromCheckIn = async ({ userId, checkIn }) => {
  try {
    const goal = await Goal.findById(checkIn.goalId);
    if (!goal || !goal.selectedSubjects?.length) return;

    // Fetch the first topic or list topics for subjects to attach logs to
    for (const subId of goal.selectedSubjects) {
      // Find a topic for this subject to make it detailed
      const topic = await Topic.findOne({ subjectId: subId });
      
      await updateMastery({
        userId,
        data: {
          subjectId: subId,
          topicId: topic ? topic._id : null,
          confidenceScore: checkIn.confidenceLevel,
          actionType: 'check_in',
        }
      });
    }
    logger.info(`Automatically logged mastery progress updates from check-in logs for user ${userId}`);
  } catch (err) {
    logger.error('Failed to trigger mastery update from check-in', { error: err.message });
  }
};

module.exports = {
  updateMastery,
  listMasteries,
  getSubjectMastery,
  getWeakTopics,
  getRevisionQueue,
  triggerMasteryUpdateFromCheckIn,
};
