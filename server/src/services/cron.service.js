const cron = require('node-cron');
const env = require('../config/env');
const logger = require('../config/logger');
const { CRON_SCHEDULES } = require('../constants');

const registerCronJob = (schedule, handler, name) => {
  return cron.schedule(schedule, async () => {
    try {
      await handler();
      logger.info(`Cron job executed: ${name}`);
    } catch (error) {
      logger.error(`Cron job failed: ${name}`, { error: error.message });
    }
  });
};

const createNoopHandler = (name) => async () => {
  logger.info(`Cron job ${name} is registered but no handler is connected yet.`);
};

const cleanupExpiredTokens = async ({ User } = {}) => {
  if (!User) {
    throw new Error('User model is required for token cleanup');
  }

  const now = new Date();

  const passwordResetResult = await User.updateMany(
    { passwordResetExpiresAt: { $lte: now } },
    {
      $set: {
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    }
  );

  const emailVerificationResult = await User.updateMany(
    { emailVerificationExpires: { $lte: now } },
    {
      $set: {
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    }
  );

  return {
    passwordResetResult,
    emailVerificationResult,
  };
};

const registerCronJobs = ({
  runDailyReminders = createNoopHandler('daily reminders'),
  updateStreaks = createNoopHandler('streak updates'),
  cleanupTokens = null,
  User = null,
} = {}) => {
  const jobs = [];

  jobs.push(registerCronJob(env.cron.dailyReminderSchedule || CRON_SCHEDULES.DAILY_REMINDERS, runDailyReminders, 'daily reminders'));
  jobs.push(registerCronJob(env.cron.streakUpdateSchedule || CRON_SCHEDULES.STREAK_UPDATES, updateStreaks, 'streak updates'));

  jobs.push(
    registerCronJob(
      env.cron.cleanupExpiredTokensSchedule || CRON_SCHEDULES.CLEANUP_EXPIRED_TOKENS,
      async () => {
        if (typeof cleanupTokens === 'function') {
          await cleanupTokens();
          return;
        }

        if (User) {
          await cleanupExpiredTokens({ User });
          return;
        }

        logger.warn('Cleanup expired tokens job is registered without a User model or custom handler.');
      },
      'cleanup expired tokens'
    )
  );

  return jobs;
};

module.exports = {
  registerCronJobs,
  registerCronJob,
  cleanupExpiredTokens,
};
