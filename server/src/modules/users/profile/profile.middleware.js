const AppError = require('../../../utils/AppError');
const { isPrivateAccessAllowed } = require('./profile.utils');
const UserProfile = require('../../../models/UserProfile');

const ensureProfileAccess = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const profile = await UserProfile.findOne({ userId });

    if (!profile) {
      return next(new AppError('Profile not found', 404));
    }

    if (!isPrivateAccessAllowed({ viewerUser: req.user, targetUserId: userId, profileVisibility: profile.profileVisibility })) {
      return next(new AppError('You do not have permission to view this profile', 403));
    }

    req.profileDoc = profile;
    return next();
  } catch (error) {
    return next(error);
  }
};

const ensureOwnerOrAdmin = (req, res, next) => {
  const targetUserId = req.params.userId || req.user?._id || req.user?.id;
  const viewerUser = req.user;

  if (!viewerUser) {
    return next(new AppError('Authentication required', 401));
  }

  const viewerId = String(viewerUser._id || viewerUser.id);
  const isOwner = viewerId === String(targetUserId);
  const isAdmin = Array.isArray(viewerUser.roles) && viewerUser.roles.includes('Admin');

  if (!isOwner && !isAdmin) {
    return next(new AppError('You are not allowed to modify this profile', 403));
  }

  return next();
};

module.exports = {
  ensureProfileAccess,
  ensureOwnerOrAdmin,
};
