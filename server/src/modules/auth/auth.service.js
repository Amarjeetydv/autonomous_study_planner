const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const env = require('../../config/env');
const User = require('../../models/User');
const AppError = require('../../utils/AppError');
const logger = require('../../config/logger');
const {
  TOKEN_SELECT_FIELDS,
  generateRandomToken,
  hashToken,
  issueAuthTokens,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  sanitizeUser,
  isTokenIssuedBeforePasswordChange,
  refreshTokenMatchesStoredHash,
} = require('./auth.utils');
const { sendVerificationEmail, sendPasswordResetEmail } = require('./auth.email');
const { AUTH_ROLES } = require('./auth.constants');

const SALT_ROUNDS = 12;

const fetchAuthUserByEmail = (email) => User.findOne({ email }).select(TOKEN_SELECT_FIELDS);

const fetchAuthUserById = (id) => User.findById(id).select(TOKEN_SELECT_FIELDS);

const register = async ({ name, email, password, role }) => {
  console.log('Step 1 - Request received');
  console.log('Step 2 - Validate request');

  console.log('Step 3 - Check existing user');
  console.time('MONGODB_FIND_USER');
  const existingUser = await User.findOne({ email });
  console.timeEnd('MONGODB_FIND_USER');

  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  console.log('Step 4 - Hash password');
  console.time('BCRYPT_HASH');
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  console.timeEnd('BCRYPT_HASH');

  console.log('Step 5 - Generate verification token');
  const emailVerificationToken = generateRandomToken();

  console.log('Step 6 - Save user');
  console.time('MONGODB_SAVE_USER');
  const user = await User.create({
    name,
    email,
    passwordHash,
    roles: [role || AUTH_ROLES.STUDENT],
    status: 'pendingVerification',
    emailVerifiedAt: null,
    isVerified: false,
    emailVerificationToken: hashToken(emailVerificationToken),
    emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  console.timeEnd('MONGODB_SAVE_USER');

  console.log('Step 7 - Send verification email (Non-blocking background)');
  console.time('EMAIL_SEND_TIME');
  sendVerificationEmail(user, emailVerificationToken)
    .then(() => {
      console.timeEnd('EMAIL_SEND_TIME');
      console.log('Email sent successfully.');
    })
    .catch((emailError) => {
      console.timeEnd('EMAIL_SEND_TIME');
      console.error('❌ Email dispatch failed:', {
        message: emailError.message,
        code: emailError.code,
        command: emailError.command,
        response: emailError.response,
        responseCode: emailError.responseCode,
        stack: emailError.stack,
      });
      const verificationUrl = `${env.auth.frontendUrl || env.frontendUrl || 'http://localhost:3000'}/verify-email?token=${encodeURIComponent(emailVerificationToken)}&email=${encodeURIComponent(user.email)}`;
      logger.info(`[DEVELOPMENT ONLY] Email Verification Link: ${verificationUrl}`);
    });

  return {
    user: sanitizeUser(user),
    message: 'Registration successful. Please check your email and verify your account before logging in.',
  };
};

const login = async ({ email, password }) => {
  const user = await fetchAuthUserByEmail(email);

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  if (user.status === 'suspended') {
    throw new AppError('Account is suspended', 403);
  }

  if (!user.isVerified) {
    throw new AppError('Please verify your email before logging in.', 401);
  }

  const tokens = issueAuthTokens(user);
  user.refreshTokenHash = hashToken(tokens.refreshToken);
  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
};

const refreshAuthToken = async ({ refreshToken, res }) => {
  if (!refreshToken) {
    throw new AppError('Refresh token is required', 401);
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, env.auth.refreshTokenSecret);
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await fetchAuthUserById(decoded.sub);

  if (!user || !refreshTokenMatchesStoredHash(user, refreshToken)) {
    throw new AppError('Refresh token is invalid', 401);
  }

  if (isTokenIssuedBeforePasswordChange(user, decoded.iat)) {
    throw new AppError('Password changed. Please log in again.', 401);
  }

  const tokens = issueAuthTokens(user);
  user.refreshTokenHash = hashToken(tokens.refreshToken);
  await user.save();

  setRefreshTokenCookie(res, tokens.refreshToken);

  return {
    user: sanitizeUser(user),
    ...tokens,
  };
};

const logout = async ({ req, res }) => {
  const refreshToken = req.cookies?.[env.auth.refreshCookieName] || req.body?.refreshToken || null;
  let user = req.user ? await fetchAuthUserById(req.user._id || req.user.id) : null;

  if (!user && refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, env.auth.refreshTokenSecret);
      user = await fetchAuthUserById(decoded.sub);
    } catch (error) {
      user = null;
    }
  }

  if (user && (!refreshToken || refreshTokenMatchesStoredHash(user, refreshToken))) {
    user.refreshTokenHash = null;
    await user.save();
  }

  clearRefreshTokenCookie(res);

  return {
    message: 'Logged out successfully',
  };
};

const forgotPassword = async ({ email }) => {
  const user = await fetchAuthUserByEmail(email);

  if (!user) {
    return {
      message: 'If an account exists for that email, a password reset link has been sent.',
    };
  }

  const resetToken = generateRandomToken();

  user.passwordResetTokenHash = hashToken(resetToken);
  user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  sendPasswordResetEmail(user, resetToken).catch((emailError) => {
    logger.error('Failed to send password reset email', {
      email: user.email,
      error: emailError.message,
    });
  });

  return {
    message: 'If an account exists for that email, a password reset link has been sent.',
  };
};

const resetPassword = async ({ email, token, password }) => {
  const tokenHash = hashToken(token);
  const user = await User.findOne({
    email,
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() },
  }).select(TOKEN_SELECT_FIELDS);

  if (!user) {
    throw new AppError('Reset token is invalid or expired', 400);
  }

  user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  user.passwordChangedAt = new Date();
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  user.refreshTokenHash = null;
  await user.save();

  const tokens = issueAuthTokens(user);
  user.refreshTokenHash = hashToken(tokens.refreshToken);
  await user.save();

  return {
    user: sanitizeUser(user),
    ...tokens,
    message: 'Password reset successfully',
  };
};

const verifyEmail = async ({ token }) => {
  if (!token) {
    throw new AppError('Verification token is required', 400);
  }

  const tokenHash = hashToken(token);
  const user = await User.findOne({
    emailVerificationToken: tokenHash,
    emailVerificationExpires: { $gt: new Date() },
  }).select(TOKEN_SELECT_FIELDS);

  if (!user) {
    throw new AppError('Verification token is invalid or expired', 400);
  }

  user.isVerified = true;
  user.emailVerifiedAt = new Date();
  user.status = 'active';
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save();

  return {
    user: sanitizeUser(user),
    message: 'Email verified successfully.',
  };
};

const resendVerification = async ({ email }) => {
  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const user = await User.findOne({ email }).select(TOKEN_SELECT_FIELDS);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.isVerified) {
    throw new AppError('Email is already verified', 400);
  }

  const emailVerificationToken = generateRandomToken();
  user.emailVerificationToken = hashToken(emailVerificationToken);
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await user.save();

  sendVerificationEmail(user, emailVerificationToken).catch((emailError) => {
    const verificationUrl = `${env.auth.frontendUrl || env.frontendUrl || 'http://localhost:3000'}/verify-email?token=${encodeURIComponent(emailVerificationToken)}`;
    logger.error('Failed to send verification email during resend', {
      email: user.email,
      error: emailError.message,
    });
    logger.info(`[DEVELOPMENT ONLY] Email Verification Link (Resend): ${verificationUrl}`);
  });

  return {
    message: 'Verification email sent successfully.',
  };
};

const changePassword = async ({ userId, currentPassword, password }) => {
  const user = await User.findById(userId).select(TOKEN_SELECT_FIELDS);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  user.passwordChangedAt = new Date();
  user.refreshTokenHash = null;
  await user.save();

  const tokens = issueAuthTokens(user);
  user.refreshTokenHash = hashToken(tokens.refreshToken);
  await user.save();

  return {
    user: sanitizeUser(user),
    ...tokens,
    message: 'Password changed successfully',
  };
};

const getCurrentUser = async ({ userId }) => {
  const user = await fetchAuthUserById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return {
    user: sanitizeUser(user),
  };
};

module.exports = {
  register,
  login,
  refreshAuthToken,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  changePassword,
  getCurrentUser,
};
