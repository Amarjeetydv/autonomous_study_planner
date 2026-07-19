const gamificationRepository = require('./gamification.repository');
const AchievementDefinition = require('../../models/Achievement');
const UserAchievement = require('../../models/UserAchievement');
const DailyTask = require('../../models/DailyTask');
const DailyCheckIn = require('../../models/DailyCheckIn');
const QuizAttempt = require('../../models/QuizAttempt');
const Goal = require('../../models/Goal');
const notificationsService = require('../notifications/notifications.service');
const logger = require('../../config/logger');

// Initial master definitions list to seed
const DEFAULT_ACHIEVEMENTS = [
  {
    title: 'First Study Session',
    description: 'Complete your first focused study task block.',
    icon: 'BookOpen',
    category: 'Beginner',
    xpReward: 150,
    rarity: 'Common',
    unlockConditions: { conditionType: 'task_count', targetValue: 1 },
  },
  {
    title: '3-Day Streak',
    description: 'Maintain study consistency for 3 consecutive days.',
    icon: 'Flame',
    category: 'Consistency',
    xpReward: 250,
    rarity: 'Common',
    unlockConditions: { conditionType: 'streak', targetValue: 3 },
  },
  {
    title: '7-Day Streak',
    description: 'Maintain consistency for 7 days. Excellent habit loop!',
    icon: 'Flame',
    category: 'Consistency',
    xpReward: 500,
    rarity: 'Rare',
    unlockConditions: { conditionType: 'streak', targetValue: 7 },
  },
  {
    title: '30-Day Streak',
    description: 'Unstoppable consistency for 30 consecutive study sessions!',
    icon: 'Sparkles',
    category: 'Consistency',
    xpReward: 1500,
    rarity: 'Legendary',
    unlockConditions: { conditionType: 'streak', targetValue: 30 },
  },
  {
    title: 'First AI Plan',
    description: 'Generate your first customized study plan using AI Planning agents.',
    icon: 'Bot',
    category: 'AI Planner',
    xpReward: 200,
    rarity: 'Common',
    unlockConditions: { conditionType: 'plan_count', targetValue: 1 },
  },
  {
    title: 'Quiz Champion',
    description: 'Complete 5 diagnostic MCQ testing evaluations.',
    icon: 'Award',
    category: 'Quiz Master',
    xpReward: 400,
    rarity: 'Rare',
    unlockConditions: { conditionType: 'quiz_completed', targetValue: 5 },
  },
  {
    title: 'Perfect Quiz',
    description: 'Score 100% graded accuracy on any diagnostic exam.',
    icon: 'CheckCircle',
    category: 'Quiz Master',
    xpReward: 600,
    rarity: 'Epic',
    unlockConditions: { conditionType: 'quiz_perfect', targetValue: 1 },
  },
  {
    title: 'Revision Master',
    description: 'Engage in 5 scheduled spaced repetition reviews.',
    icon: 'RefreshCw',
    category: 'Revision Expert',
    xpReward: 350,
    rarity: 'Rare',
    unlockConditions: { conditionType: 'revision_count', targetValue: 5 },
  },
];

const seedAchievements = async () => {
  try {
    for (const def of DEFAULT_ACHIEVEMENTS) {
      const existing = await AchievementDefinition.findOne({ title: def.title });
      if (!existing) {
        await AchievementDefinition.create(def);
      }
    }
  } catch (err) {
    logger.error('Failed to seed master achievements list', { error: err.message });
  }
};

// Seed immediately on loader startup
seedAchievements();

const addXP = async (userId, xpAmount, sourceName = 'Study Action') => {
  const level = await gamificationRepository.findOrCreateUserLevel(userId);

  level.totalXP += xpAmount;
  level.currentXP += xpAmount;

  let leveledUp = false;
  while (level.currentXP >= level.nextLevelXP) {
    level.currentXP -= level.nextLevelXP;
    level.currentLevel += 1;
    level.nextLevelXP = level.currentLevel * 1000;
    leveledUp = true;
  }

  const updated = await level.save();

  if (leveledUp) {
    try {
      await notificationsService.triggerNotification({
        userId,
        type: 'System Notification',
        title: 'Level Up!',
        message: `Congratulations! You leveled up to Level ${updated.currentLevel}! Keep up your consistent study loop.`,
        priority: 'High',
      });
    } catch (err) {
      logger.error('Failed to trigger Level Up notification', { error: err.message });
    }
  }

  return updated;
};

const evaluateAchievements = async (userId, conditionType, currentValue) => {
  try {
    const definitions = await AchievementDefinition.find({ 'unlockConditions.conditionType': conditionType });

    for (const def of definitions) {
      const userAch = await gamificationRepository.findOrCreateUserAchievement(userId, def._id);
      if (userAch.unlockedAt) continue; // already unlocked

      let newProgress = userAch.progress;
      if (conditionType === 'streak') {
        newProgress = currentValue; // streak length directly
      } else {
        newProgress += currentValue; // increments
      }

      const isUnlocked = newProgress >= def.unlockConditions.targetValue;

      userAch.progress = newProgress;
      if (isUnlocked) {
        userAch.unlockedAt = new Date();
        // Award XP
        await addXP(userId, def.xpReward, def.title);
        // Trigger notification
        await notificationsService.triggerNotification({
          userId,
          type: 'Achievement Earned',
          title: `Achievement Unlocked: ${def.title}!`,
          message: `${def.description} (Earned +${def.xpReward} XP)`,
          priority: 'High',
          relatedEntityType: 'UserAchievement',
          relatedEntityId: userAch._id,
        });
      }

      await userAch.save();
    }
  } catch (err) {
    logger.error('Failed to evaluate study achievements progress checks', { error: err.message });
  }
};

const getUserLevel = async (userId) => {
  return gamificationRepository.findOrCreateUserLevel(userId);
};

const listUserAchievements = async (userId) => {
  return gamificationRepository.findUserAchievements(userId);
};

const listAllAchievements = async () => {
  return AchievementDefinition.find().lean();
};

const recalculateLevel = async (userId) => {
  const level = await gamificationRepository.findOrCreateUserLevel(userId);

  // Scan items
  const tasksCompleted = await DailyTask.countDocuments({ userId, status: 'Completed' });
  const checkinsLogged = await DailyCheckIn.countDocuments({ userId });
  const quizzesCompleted = await QuizAttempt.countDocuments({ userId });
  const perfectQuizzes = await QuizAttempt.countDocuments({ userId, accuracy: 100 });

  // XP weights
  const tasksXP = tasksCompleted * 100;
  const checkinsXP = checkinsLogged * 150;
  const quizzesXP = quizzesCompleted * 200;
  const perfectXP = perfectQuizzes * 500;

  const totalCalculatedXP = tasksXP + checkinsXP + quizzesXP + perfectXP;

  level.totalXP = totalCalculatedXP;
  
  // Re-calculate Level blocks
  let currentLvl = 1;
  let remainingXP = totalCalculatedXP;
  let targetThreshold = currentLvl * 1000;

  while (remainingXP >= targetThreshold) {
    remainingXP -= targetThreshold;
    currentLvl += 1;
    targetThreshold = currentLvl * 1000;
  }

  level.currentLevel = currentLvl;
  level.currentXP = remainingXP;
  level.nextLevelXP = targetThreshold;

  const saved = await level.save();

  // Evaluate definitions checks
  if (tasksCompleted > 0) await evaluateAchievements(userId, 'task_count', tasksCompleted);
  if (quizzesCompleted > 0) await evaluateAchievements(userId, 'quiz_completed', quizzesCompleted);
  if (perfectQuizzes > 0) await evaluateAchievements(userId, 'quiz_perfect', perfectQuizzes);

  return saved;
};

module.exports = {
  addXP,
  evaluateAchievements,
  getUserLevel,
  listUserAchievements,
  listAllAchievements,
  recalculateLevel,
};
