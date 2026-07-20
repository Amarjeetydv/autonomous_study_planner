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
const { AUTH_ROLES } = require('./auth.constants');

const SALT_ROUNDS = 12;

const fetchAuthUserByEmail = (email) => User.findOne({ email }).select(TOKEN_SELECT_FIELDS);
const fetchAuthUserById = (id) => User.findById(id).select(TOKEN_SELECT_FIELDS);

const mongoose = require('mongoose');
const Streak = require('../../models/Streak');

const register = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  let session = null;
  let useTransaction = false;

  try {
    session = await mongoose.startSession();
    // Enable transactions if MongoDB is connected to a replica set or mongos cluster
    if (session && session.client && session.client.topology && session.client.topology.description.type !== 'Single') {
      session.startTransaction();
      useTransaction = true;
    }
  } catch (err) {
    session = null;
  }

  let user = null;
  let streak = null;

  try {
    if (useTransaction) {
      const [newUser] = await User.create(
        [
          {
            name,
            email,
            passwordHash,
            roles: [role || AUTH_ROLES.STUDENT],
            status: 'active',
            emailVerifiedAt: new Date(),
            isVerified: true,
          },
        ],
        { session }
      );
      user = newUser;
    } else {
      user = await User.create({
        name,
        email,
        passwordHash,
        roles: [role || AUTH_ROLES.STUDENT],
        status: 'active',
        emailVerifiedAt: new Date(),
        isVerified: true,
      });
    }

    // Idempotent streak creation using findOneAndUpdate with $setOnInsert
    const streakOptions = { upsert: true, new: true };
    if (useTransaction) streakOptions.session = session;

    streak = await Streak.findOneAndUpdate(
      { studentId: user._id },
      {
        $setOnInsert: {
          currentStreak: 0,
          longestStreak: 0,
          totalStudyDays: 0,
          weeklyDates: [],
        },
      },
      streakOptions
    );

    if (useTransaction) {
      await session.commitTransaction();
      session.endSession();
    }
  } catch (err) {
    if (useTransaction && session) {
      try {
        await session.abortTransaction();
        session.endSession();
      } catch (abortErr) {}
    }

    // Fallback rollback cleanup for non-replica instances
    if (user && user._id) {
      await User.findByIdAndDelete(user._id).catch(() => {});
      await Streak.deleteOne({ studentId: user._id }).catch(() => {});
    }

    logger.error('Registration failed during user & streak creation', { error: err.message });
    throw new AppError('Registration failed. Please try again.', 500);
  } finally {
    if (session && !useTransaction) {
      session.endSession();
    }
  }

  return {
    user: sanitizeUser(user),
    message: 'Registration successful. Please log in.',
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

  logger.info('Password reset token generated:', { email: user.email, resetToken });

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
  changePassword,
  getCurrentUser,
};
