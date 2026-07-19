const asyncHandler = require('../../middlewares/asyncHandler');
const { sendResponse } = require('../../utils/response');
const env = require('../../config/env');
const { setRefreshTokenCookie } = require('./auth.utils');
const {
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
} = require('./auth.service');

const registerController = asyncHandler(async (req, res) => {
  const result = await register(req.body);

  return sendResponse(
    res,
    {
      success: true,
      message: result.message,
      data: { user: result.user },
      errors: [],
    },
    201
  );
});

const loginController = asyncHandler(async (req, res) => {
  const result = await login(req.body);
  setRefreshTokenCookie(res, result.refreshToken);

  return sendResponse(
    res,
    {
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
      errors: [],
    },
    200
  );
});

const refreshTokenController = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[env.auth.refreshCookieName] || req.body.refreshToken;
  const result = await refreshAuthToken({ refreshToken, res });

  return sendResponse(
    res,
    {
      success: true,
      message: 'Token refreshed successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
      errors: [],
    },
    200
  );
});

const logoutController = asyncHandler(async (req, res) => {
  const result = await logout({ req, res });

  return sendResponse(
    res,
    {
      success: true,
      message: result.message,
      data: null,
      errors: [],
    },
    200
  );
});

const forgotPasswordController = asyncHandler(async (req, res) => {
  const result = await forgotPassword(req.body);

  return sendResponse(
    res,
    {
      success: true,
      message: result.message,
      data: null,
      errors: [],
    },
    200
  );
});

const resetPasswordController = asyncHandler(async (req, res) => {
  const result = await resetPassword(req.body);
  setRefreshTokenCookie(res, result.refreshToken);

  return sendResponse(
    res,
    {
      success: true,
      message: result.message,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
      errors: [],
    },
    200
  );
});

const verifyEmailController = asyncHandler(async (req, res) => {
  const token = req.body.token || req.query.token;
  const result = await verifyEmail({ token });

  return sendResponse(
    res,
    {
      success: true,
      message: result.message,
      data: { user: result.user },
      errors: [],
    },
    200
  );
});

const changePasswordController = asyncHandler(async (req, res) => {
  const result = await changePassword({
    userId: req.user._id || req.user.id,
    currentPassword: req.body.currentPassword,
    password: req.body.password,
  });
  setRefreshTokenCookie(res, result.refreshToken);

  return sendResponse(
    res,
    {
      success: true,
      message: result.message,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
      errors: [],
    },
    200
  );
});

const getCurrentUserController = asyncHandler(async (req, res) => {
  const result = await getCurrentUser({ userId: req.user._id || req.user.id });

  return sendResponse(
    res,
    {
      success: true,
      message: 'Current user fetched successfully',
      data: result,
      errors: [],
    },
    200
  );
});

const resendVerificationController = asyncHandler(async (req, res) => {
  const result = await resendVerification({ email: req.body.email });

  return sendResponse(
    res,
    {
      success: true,
      message: result.message,
      data: null,
      errors: [],
    },
    200
  );
});

module.exports = {
  registerController,
  loginController,
  refreshTokenController,
  logoutController,
  forgotPasswordController,
  resetPasswordController,
  verifyEmailController,
  resendVerificationController,
  changePasswordController,
  getCurrentUserController,
};
