const express = require('express');
const {
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
} = require('./auth.controller');
const { publicAuthLimiter, passwordSensitiveLimiter, resendVerificationLimiter, protect } = require('./auth.middleware');
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  verifyEmailValidator,
  changePasswordValidator,
  resendVerificationValidator,
} = require('./auth.validators');
const validateRequest = require('../../middlewares/validateRequest.middleware');

const router = express.Router();

router.post('/register', publicAuthLimiter, registerValidator, validateRequest, registerController);
router.post('/login', publicAuthLimiter, loginValidator, validateRequest, loginController);
router.post('/refresh-token', passwordSensitiveLimiter, refreshTokenController);
router.post('/logout', logoutController);
router.post('/forgot-password', passwordSensitiveLimiter, forgotPasswordValidator, validateRequest, forgotPasswordController);
router.post('/reset-password', passwordSensitiveLimiter, resetPasswordValidator, validateRequest, resetPasswordController);
router
  .route('/verify-email')
  .post(publicAuthLimiter, verifyEmailValidator, validateRequest, verifyEmailController)
  .get(publicAuthLimiter, verifyEmailController);
router.post('/change-password', protect, changePasswordValidator, validateRequest, changePasswordController);
router.post('/resend-verification', resendVerificationLimiter, resendVerificationValidator, validateRequest, resendVerificationController);
router.get('/me', protect, getCurrentUserController);

module.exports = router;
