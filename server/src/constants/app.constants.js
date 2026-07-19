const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc',
};

const EMAIL_SUBJECTS = {
  WELCOME: 'Welcome to Autonomous Study Planner',
  PASSWORD_RESET: 'Reset your Autonomous Study Planner password',
  EMAIL_VERIFICATION: 'Verify your Autonomous Study Planner email address',
};

const NOTIFICATION_CHANNELS = {
  IN_APP: 'inApp',
  EMAIL: 'email',
  PUSH: 'push',
  SMS: 'sms',
};

const CRON_SCHEDULES = {
  DAILY_REMINDERS: '0 8 * * *',
  STREAK_UPDATES: '0 23 * * *',
  CLEANUP_EXPIRED_TOKENS: '0 2 * * *',
};

module.exports = {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  SORT_ORDER,
  EMAIL_SUBJECTS,
  NOTIFICATION_CHANNELS,
  CRON_SCHEDULES,
};
