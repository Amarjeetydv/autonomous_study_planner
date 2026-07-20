const express = require('express');
const {
  registerController,
  loginController,
  refreshTokenController,
  logoutController,
  forgotPasswordController,
  resetPasswordController,
  changePasswordController,
  getCurrentUserController,
} = require('./auth.controller');
const { publicAuthLimiter, passwordSensitiveLimiter, protect } = require('./auth.middleware');
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
} = require('./auth.validators');
const validateRequest = require('../../middlewares/validateRequest.middleware');

const router = express.Router();

router.post('/register', publicAuthLimiter, registerValidator, validateRequest, registerController);
router.post('/login', publicAuthLimiter, loginValidator, validateRequest, loginController);
router.post('/refresh-token', passwordSensitiveLimiter, refreshTokenController);
router.post('/logout', logoutController);
router.post('/forgot-password', passwordSensitiveLimiter, forgotPasswordValidator, validateRequest, forgotPasswordController);
router.post('/reset-password', passwordSensitiveLimiter, resetPasswordValidator, validateRequest, resetPasswordController);
router.post('/change-password', protect, changePasswordValidator, validateRequest, changePasswordController);
router.get('/me', protect, getCurrentUserController);

module.exports = router;
