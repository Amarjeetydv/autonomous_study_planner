const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const env = require('../../config/env');
const User = require('../../models/User');
const AppError = require('../../utils/AppError');
const {
  TOKEN_SELECT_FIELDS,
  sanitizeUser,
  isTokenIssuedBeforePasswordChange,
  refreshTokenMatchesStoredHash,
} = require('./auth.utils');
const { PERMISSIONS_BY_ROLE } = require('./auth.constants');

const isDev = env.nodeEnv === 'development';

const publicAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isDev ? 1000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    data: null,
    errors: [],
  },
});

const passwordSensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isDev ? 1000 : 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password requests, please slow down.',
    data: null,
    errors: [],
  },
});

const resendVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isDev ? 1000 : 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many verification email requests, please try again in 15 minutes.',
    data: null,
    errors: [],
  },
});

const extractAccessToken = (req) => {
  const authorizationHeader = req.headers.authorization;

  if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
    return authorizationHeader.split(' ')[1];
  }

  return req.cookies?.accessToken || req.query.token || null;
};

const protect = async (req, res, next) => {
  try {
    const token = extractAccessToken(req);

    if (!token) {
      return next(new AppError('Authentication required', 401));
    }

    const decoded = jwt.verify(token, env.auth.accessTokenSecret);
    const user = await User.findById(decoded.sub).select(TOKEN_SELECT_FIELDS);

    if (!user || user.status === 'suspended' || !user.isVerified) {
      return next(new AppError('Account is not available', 403));
    }

    if (isTokenIssuedBeforePasswordChange(user, decoded.iat)) {
      return next(new AppError('Password changed. Please log in again.', 401));
    }

    req.user = sanitizeUser(user);
    return next();
  } catch (error) {
    return next(new AppError('Invalid or expired access token', 401));
  }
};

const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  const userRoles = req.user?.roles || [];
  const hasAllowedRole = userRoles.some((role) => allowedRoles.includes(role));

  if (!hasAllowedRole) {
    return next(new AppError('You do not have permission to access this resource', 403));
  }

  return next();
};

const authorizePermissions = (...requiredPermissions) => (req, res, next) => {
  const userRoles = req.user?.roles || [];

  const hasPermission = requiredPermissions.every((permission) =>
    userRoles.some((role) => {
      const rolePermissions = PERMISSIONS_BY_ROLE[role] || [];

      return rolePermissions.includes('*') || rolePermissions.includes(permission);
    })
  );

  if (!hasPermission) {
    return next(new AppError('Insufficient permissions', 403));
  }

  return next();
};

module.exports = {
  publicAuthLimiter,
  passwordSensitiveLimiter,
  resendVerificationLimiter,
  protect,
  authorizeRoles,
  authorizePermissions,
  extractAccessToken,
  refreshTokenMatchesStoredHash,
};
