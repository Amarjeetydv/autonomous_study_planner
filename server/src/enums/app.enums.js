const QUERY_MODES = {
  KEYWORD: 'keyword',
  MULTI_FIELD: 'multiField',
};

const FILE_TYPES = {
  IMAGE: 'image',
  DOCUMENT: 'document',
};

const NOTIFICATION_TYPES = {
  REMINDER: 'reminder',
  SYSTEM: 'system',
  EMAIL: 'email',
  IN_APP: 'inApp',
};

const JOB_NAMES = {
  DAILY_REMINDERS: 'dailyReminders',
  STREAK_UPDATES: 'streakUpdates',
  CLEANUP_EXPIRED_TOKENS: 'cleanupExpiredTokens',
};

module.exports = {
  QUERY_MODES,
  FILE_TYPES,
  NOTIFICATION_TYPES,
  JOB_NAMES,
};
