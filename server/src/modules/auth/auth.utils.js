const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const env = require('../../config/env');

const TOKEN_SELECT_FIELDS =
  '+passwordHash +refreshTokenHash +emailVerificationToken +emailVerificationExpires +passwordResetTokenHash +passwordResetExpiresAt +passwordChangedAt +emailVerifiedAt +isVerified';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const generateRandomToken = () => crypto.randomBytes(32).toString('hex');

const signAccessToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      roles: user.roles,
      tokenType: 'access',
    },
    env.auth.accessTokenSecret,
    { expiresIn: env.auth.accessTokenExpiresIn }
  );

const signRefreshToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      tokenType: 'refresh',
    },
    env.auth.refreshTokenSecret,
    { expiresIn: env.auth.refreshTokenExpiresIn }
  );

const issueAuthTokens = (user) => ({
  accessToken: signAccessToken(user),
  refreshToken: signRefreshToken(user),
});

const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.nodeEnv === 'production' || env.cookieSecure,
  sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
  path: '/',
  maxAge: 1000 * 60 * 60 * 24 * 7,
});

const setRefreshTokenCookie = (res, token) => {
  res.cookie(env.auth.refreshCookieName, token, getRefreshCookieOptions());
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie(env.auth.refreshCookieName, {
    httpOnly: true,
    secure: env.nodeEnv === 'production' || env.cookieSecure,
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
    path: '/',
  });
};

const sanitizeUser = (user) => {
  const plainUser = typeof user.toObject === 'function' ? user.toObject() : { ...user };

  delete plainUser.passwordHash;
  delete plainUser.refreshTokenHash;
  delete plainUser.emailVerificationToken;
  delete plainUser.emailVerificationExpires;
  delete plainUser.passwordResetTokenHash;
  delete plainUser.passwordResetExpiresAt;
  delete plainUser.passwordChangedAt;

  return plainUser;
};

const isTokenIssuedBeforePasswordChange = (user, tokenIssuedAt) => {
  if (!user.passwordChangedAt) {
    return false;
  }

  return tokenIssuedAt * 1000 < new Date(user.passwordChangedAt).getTime();
};

const refreshTokenMatchesStoredHash = (user, token) => {
  if (!user.refreshTokenHash) {
    return false;
  }

  return user.refreshTokenHash === hashToken(token);
};

module.exports = {
  TOKEN_SELECT_FIELDS,
  hashToken,
  generateRandomToken,
  issueAuthTokens,
  getRefreshCookieOptions,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  sanitizeUser,
  isTokenIssuedBeforePasswordChange,
  refreshTokenMatchesStoredHash,
};
