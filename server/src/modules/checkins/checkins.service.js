const checkinsRepository = require('./checkins.repository');
const DailyCheckIn = require('../../models/DailyCheckIn');
const Streak = require('../../models/Streak');
const Goal = require('../../models/Goal');
const AppError = require('../../utils/errors/AppError');
const logger = require('../../config/logger');
const { runGeminiStage } = require('../aiPlanning/services/gemini.service');

const SYSTEM_PROMPT = `
You are the "ASP Feedback Loop Agent" for the Autonomous Study Planner.
Your role is to analyze a student's daily check-in logs and provide insights.
Evaluate mood, focus, confidence levels, actual hours logged vs planned, missed tasks, and notes.

You must respond in valid JSON format matching this schema:
{
  "summary": "String (1-2 sentences summarizing performance today)",
  "insights": ["String (detailed learning insights, focus times, etc)"],
  "weakTrends": ["String (weakness trends, blockers, tiredness)"],
  "suggestions": ["String (actionable advice to optimize tomorrow)"],
  "hourAdjustment": Number (suggested minutes offset, negative for decompression, positive for spare capacity),
  "motivation": "String (short motivational trigger phrase)"
}
Do not return any markdown wraps or additional fields. Only output raw JSON.
`;

const generateAIObservations = async (checkInData, notes) => {
  try {
    const userPrompt = `
    DAILY PERFORMANCE DATA:
    Planned Hours: ${checkInData.plannedStudyHours}
    Actual Hours: ${checkInData.actualStudyHours}
    Completed Tasks count: ${checkInData.completedTasks}
    Missed Tasks count: ${checkInData.missedTasks}
    Skipped Tasks count: ${checkInData.skippedTasks}
    Mood: ${checkInData.mood}
    Energy Level (1-5): ${checkInData.energyLevel}
    Focus Level (1-5): ${checkInData.focusLevel}
    Confidence Level (1-5): ${checkInData.confidenceLevel}
    Difficulty Level (1-5): ${checkInData.difficultyLevel}
    Productivity Rating (1-5): ${checkInData.productivityRating}
    Blockers: ${checkInData.blockers?.join(', ') || 'None'}
    Student Notes: "${notes || 'No extra notes.'}"
    `;

    const response = await runGeminiStage({
      stage: 'CheckInFeedback',
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.2,
    });

    const parsed = JSON.parse(response.text);
    return {
      summary: parsed.summary || 'Daily check-in completed.',
      insights: parsed.insights || [],
      weakTrends: parsed.weakTrends || [],
      suggestions: parsed.suggestions || [],
      hourAdjustment: Number(parsed.hourAdjustment) || 0,
      motivation: parsed.motivation || 'Keep consistent!',
    };
  } catch (err) {
    logger.error('Failed to generate AI observations for check-in', { error: err.message });
    return {
      summary: 'Daily check-in logged successfully.',
      insights: ['Maintain regular study intervals.'],
      weakTrends: [],
      suggestions: ['Continue tracking metrics.'],
      hourAdjustment: 0,
      motivation: 'Stay focused and consistent!',
    };
  }
};

const createCheckIn = async ({ userId, data }) => {
  // Strip hours to enforce unique date mapping at midnight UTC/local
  const checkInDate = new Date(data.date || Date.now());
  checkInDate.setHours(0, 0, 0, 0);

  const existing = await DailyCheckIn.findOne({ userId, date: checkInDate });
  if (existing) {
    throw new AppError('You have already submitted your daily check-in for today', 400);
  }

  const activeGoal = await Goal.findOne({ studentId: userId, status: 'active' });
  if (!activeGoal) {
    throw new AppError('No active goal found. Please create a goal first.', 404);
  }

  // Generate AI observations
  const aiInsights = await generateAIObservations(data, data.notes);

  // Save Check-in
  const checkIn = await DailyCheckIn.create({
    ...data,
    userId,
    goalId: activeGoal._id,
    date: checkInDate,
    aiInsights,
  });

  try {
    const masteryService = require('../mastery/mastery.service');
    await masteryService.triggerMasteryUpdateFromCheckIn({ userId, checkIn });
  } catch (err) {
    logger.error('Failed to trigger mastery update from check-in log success', { error: err.message });
  }

  // Calculate Streak
  let streak = await Streak.findOneAndUpdate(
    { studentId: userId },
    {
      $setOnInsert: {
        currentStreak: 0,
        longestStreak: 0,
        totalStudyDays: 0,
        weeklyDates: [],
      },
    },
    { upsert: true, new: true }
  );

  const todayStr = checkInDate.toDateString();
  const lastCheckInStr = streak.lastCheckInDate ? new Date(streak.lastCheckInDate).toDateString() : null;

  if (!lastCheckInStr) {
    streak.currentStreak = 1;
    streak.longestStreak = 1;
    streak.totalStudyDays = 1;
  } else if (todayStr !== lastCheckInStr) {
    const yesterday = new Date(checkInDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (lastCheckInStr === yesterdayStr) {
      streak.currentStreak += 1;
      if (streak.currentStreak > streak.longestStreak) {
        streak.longestStreak = streak.currentStreak;
      }
    } else {
      streak.currentStreak = 1; // reset streak if gap detected
    }
    streak.totalStudyDays += 1;
  }

  streak.lastCheckInDate = checkInDate;

  // Add week start dates for consistency
  const currentWeekStart = new Date(checkInDate);
  currentWeekStart.setDate(checkInDate.getDate() - checkInDate.getDay());
  currentWeekStart.setHours(0, 0, 0, 0);

  const hasThisWeek = streak.weeklyDates.some(d => {
    const wd = new Date(d);
    wd.setHours(0, 0, 0, 0);
    return wd.getTime() === currentWeekStart.getTime();
  });

  if (!hasThisWeek) {
    streak.weeklyDates.push(currentWeekStart);
  }

  await streak.save();

  try {
    const gamificationService = require('../gamification/gamification.service');
    await gamificationService.addXP(userId, 150, 'Daily Check-in Complete');
    await gamificationService.evaluateAchievements(userId, 'streak', streak.currentStreak);
  } catch (err) {
    logger.error('Failed to trigger gamification updates on check-in success', { error: err.message });
  }

  return { checkIn, streak };
};

const getStreak = async (userId) => {
  const streak = await Streak.findOne({ studentId: userId }).lean();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCheckIn = await DailyCheckIn.findOne({ userId, date: today }).lean();

  if (!streak) {
    return {
      _id: null,
      studentId: userId,
      currentStreak: 0,
      longestStreak: 0,
      totalStudyDays: 0,
      lastCheckInDate: null,
      weeklyDates: [],
      todayCompleted: !!todayCheckIn,
    };
  }

  return {
    _id: streak._id,
    studentId: streak.studentId,
    currentStreak: streak.currentStreak || 0,
    longestStreak: streak.longestStreak || 0,
    totalStudyDays: streak.totalStudyDays || 0,
    lastCheckInDate: streak.lastCheckInDate || null,
    weeklyDates: streak.weeklyDates || [],
    todayCompleted: !!todayCheckIn,
  };
};

const getHistory = async (userId) => {
  return DailyCheckIn.find({ userId }).sort({ date: -1 }).lean();
};

const getTodayCheckIn = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return DailyCheckIn.findOne({ userId, date: today });
};

const getAnalytics = async (userId) => {
  const checkIns = await DailyCheckIn.find({ userId }).sort({ date: 1 }).limit(30).lean();
  
  // Calculate averages
  let totalHours = 0;
  let focusSum = 0;
  let productivitySum = 0;
  const moodCounts = {};

  checkIns.forEach((c) => {
    totalHours += c.actualStudyHours || 0;
    focusSum += c.focusLevel || 0;
    productivitySum += c.productivityRating || 0;
    
    moodCounts[c.mood] = (moodCounts[c.mood] || 0) + 1;
  });

  const count = checkIns.length || 1;
  return {
    checkInsCount: checkIns.length,
    averages: {
      dailyStudyHours: totalHours / count,
      focusLevel: focusSum / count,
      productivityRating: productivitySum / count,
    },
    moodTrends: moodCounts,
    rawHistory: checkIns,
  };
};

module.exports = {
  createCheckIn,
  getStreak,
  getHistory,
  getTodayCheckIn,
  getAnalytics,
};
