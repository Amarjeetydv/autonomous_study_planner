const dotenv = require('dotenv');

// Load environment variables once at startup before any other config runs.
dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || '',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 100),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  auth: {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_me',
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me',
    passwordResetSecret: process.env.JWT_PASSWORD_RESET_SECRET || 'dev_password_reset_secret_change_me',
    accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m',
    refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d',
    passwordResetExpiresIn: process.env.PASSWORD_RESET_TOKEN_EXPIRES_IN || '1h',
    refreshCookieName: process.env.REFRESH_TOKEN_COOKIE_NAME || 'asp_refresh_token',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'autonomous-study-planner',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
    temperature: Number(process.env.GEMINI_TEMPERATURE || 0.4),
    timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS || 60000),
    maxRetries: Number(process.env.GEMINI_MAX_RETRIES || 4),
    streamingEnabled: process.env.GEMINI_STREAMING_ENABLED !== 'false',
  },
  upload: {
    maxFileSizeMb: Number(process.env.UPLOAD_MAX_FILE_SIZE_MB || 5),
    allowedImageMimeTypes: (process.env.UPLOAD_ALLOWED_IMAGE_MIME_TYPES || 'image/jpeg,image/png,image/webp').split(','),
  },
  cron: {
    dailyReminderSchedule: process.env.CRON_DAILY_REMINDER_SCHEDULE || '0 8 * * *',
    streakUpdateSchedule: process.env.CRON_STREAK_UPDATE_SCHEDULE || '0 23 * * *',
    cleanupExpiredTokensSchedule: process.env.CRON_CLEANUP_EXPIRED_TOKENS_SCHEDULE || '0 2 * * *',
  },
};

module.exports = env;
