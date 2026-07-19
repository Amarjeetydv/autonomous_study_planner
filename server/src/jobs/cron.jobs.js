const User = require('../models/User');
const logger = require('../config/logger');
const { registerCronJobs, cleanupExpiredTokens } = require('../services/cron.service');
const { notificationService } = require('../services/notification.service');

const startSharedCronJobs = ({ runDailyReminders, updateStreaks } = {}) => {
  return registerCronJobs({
    runDailyReminders: runDailyReminders || (async () => logger.info('Daily reminders job is running with no domain handler yet.')),
    updateStreaks: updateStreaks || (async () => logger.info('Streak updates job is running with no domain handler yet.')),
    User,
    cleanupTokens: async () => cleanupExpiredTokens({ User }),
  });
};

module.exports = {
  startSharedCronJobs,
  notificationService,
};
