const express = require('express');
const {
  getMyProfileController,
  updateMyProfileController,
  uploadProfilePictureController,
  deleteProfilePictureController,
  updateSettingsController,
  updateVisibilityController,
  getPublicProfileController,
  getPrivateProfileController,
} = require('./profile.controller');
const { protect, authorizeRoles } = require('../../../modules/auth/auth.middleware');
const validateRequest = require('../../../middlewares/validateRequest.middleware');
const { createMulterUploader } = require('../../../services/fileUpload.service');
const {
  updateProfileValidator,
  updateSettingsValidator,
  profileUserIdValidator,
} = require('./profile.validators');
const { profilePictureValidator, visibilityValidator } = require('./profile.route.validators');

const upload = createMulterUploader();
const router = express.Router();

router.get('/me', protect, getMyProfileController);
router.patch('/me', protect, updateProfileValidator, validateRequest, updateMyProfileController);
router.patch('/me/picture', protect, upload.single('profilePicture'), uploadProfilePictureController);
router.delete('/me/picture', protect, deleteProfilePictureController);
router.patch('/me/settings', protect, updateSettingsValidator, validateRequest, updateSettingsController);
router.patch('/me/visibility', protect, visibilityValidator, validateRequest, updateVisibilityController);
router.get('/public/:userId', profileUserIdValidator, validateRequest, getPublicProfileController);
router.get('/private/:userId', protect, profileUserIdValidator, validateRequest, getPrivateProfileController);

module.exports = router;
