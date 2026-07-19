const { validationResult } = require('express-validator');
const asyncHandler = require('../../../middlewares/asyncHandler');
const { sendResponse } = require('../../../utils/response');
const AppError = require('../../../utils/AppError');
const {
  updateProfile,
  updateProfilePicture,
  deleteProfilePicture,
  updateSettings,
  getPrivateProfile,
  getCurrentProfile,
  getPublicProfile,
} = require('./profile.service');

const extractValidationErrors = (req) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return [];
  }

  return result.array().map((error) => ({
    field: error.path,
    message: error.msg,
  }));
};

const assertNoValidationErrors = (req) => {
  const errors = extractValidationErrors(req);

  if (errors.length > 0) {
    throw new AppError('Validation failed', 400, errors);
  }
};

const getMyProfileController = asyncHandler(async (req, res) => {
  const result = await getCurrentProfile({ userId: req.user._id || req.user.id });

  return sendResponse(
    res,
    {
      success: true,
      message: 'Profile fetched successfully',
      data: result,
      errors: [],
    },
    200
  );
});

const updateMyProfileController = asyncHandler(async (req, res) => {
  assertNoValidationErrors(req);

  const result = await updateProfile({ userId: req.user._id || req.user.id, data: req.body });

  return sendResponse(
    res,
    {
      success: true,
      message: 'Profile updated successfully',
      data: {
        profile: result.profile,
      },
      errors: [],
    },
    200
  );
});

const uploadProfilePictureController = asyncHandler(async (req, res) => {
  const result = await updateProfilePicture({ userId: req.user._id || req.user.id, file: req.file });

  return sendResponse(
    res,
    {
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profile: result.profile,
      },
      errors: [],
    },
    200
  );
});

const deleteProfilePictureController = asyncHandler(async (req, res) => {
  const result = await deleteProfilePicture({ userId: req.user._id || req.user.id });

  return sendResponse(
    res,
    {
      success: true,
      message: 'Profile picture deleted successfully',
      data: {
        profile: result.profile,
      },
      errors: [],
    },
    200
  );
});

const updateSettingsController = asyncHandler(async (req, res) => {
  assertNoValidationErrors(req);

  const result = await updateSettings({ userId: req.user._id || req.user.id, data: req.body });

  return sendResponse(
    res,
    {
      success: true,
      message: 'Settings updated successfully',
      data: {
        profile: result.profile,
      },
      errors: [],
    },
    200
  );
});

const updateVisibilityController = asyncHandler(async (req, res) => {
  assertNoValidationErrors(req);

  const result = await updateProfile({
    userId: req.user._id || req.user.id,
    data: { profileVisibility: req.body.profileVisibility },
  });

  return sendResponse(
    res,
    {
      success: true,
      message: 'Profile visibility updated successfully',
      data: {
        profile: result.profile,
      },
      errors: [],
    },
    200
  );
});

const getPublicProfileController = asyncHandler(async (req, res) => {
  const result = await getPublicProfile({
    userId: req.params.userId,
    viewerUser: req.user || null,
  });

  return sendResponse(
    res,
    {
      success: true,
      message: 'Public profile fetched successfully',
      data: result,
      errors: [],
    },
    200
  );
});

const getPrivateProfileController = asyncHandler(async (req, res) => {
  const result = await getPrivateProfile({ userId: req.params.userId, viewerUser: req.user });

  return sendResponse(
    res,
    {
      success: true,
      message: 'Private profile fetched successfully',
      data: result,
      errors: [],
    },
    200
  );
});

module.exports = {
  getMyProfileController,
  updateMyProfileController,
  uploadProfilePictureController,
  deleteProfilePictureController,
  updateSettingsController,
  updateVisibilityController,
  getPublicProfileController,
  getPrivateProfileController,
};
