const User = require('../../../models/User');
const UserProfile = require('../../../models/UserProfile');
const AppError = require('../../../utils/AppError');
const { uploadImage, deleteFile } = require('../../../services/fileUpload.service');
const { buildProfileSettings, buildPublicProfile, buildPrivateProfile, normalizeProfileArray } = require('./profile.utils');
const { PROFILE_VISIBILITY } = require('./profile.constants');

const getOrCreateProfile = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  let profile = await UserProfile.findOne({ userId });

  if (!profile) {
    profile = await UserProfile.create({
      userId,
      fullName: user.name,
      phoneNumber: user.phone || '',
      timeZone: user.timezone || '',
      settings: {
        emailNotifications: user.preferences?.notificationPreferences?.email ?? true,
        pushNotifications: user.preferences?.notificationPreferences?.push ?? true,
        reminderTime: '08:00',
        theme: user.preferences?.themePreference || 'system',
        language: user.locale || 'en',
      },
    });
  }

  return { user, profile };
};

const updateProfile = async ({ userId, data }) => {
  const { user, profile } = await getOrCreateProfile(userId);

  if (data.fullName) {
    profile.fullName = data.fullName;
    user.name = data.fullName;
  }

  if (data.phoneNumber !== undefined) {
    profile.phoneNumber = data.phoneNumber || '';
    user.phone = data.phoneNumber || '';
  }

  if (data.dateOfBirth !== undefined) {
    profile.dateOfBirth = data.dateOfBirth || null;
  }

  if (data.gender) profile.gender = data.gender;
  if (data.education !== undefined) profile.education = data.education || '';
  if (data.college !== undefined) profile.college = data.college || '';
  if (data.university !== undefined) profile.university = data.university || '';

  if (data.skills !== undefined) profile.skills = normalizeProfileArray(data.skills);
  if (data.interests !== undefined) profile.interests = normalizeProfileArray(data.interests);

  if (data.learningStyle) profile.learningStyle = data.learningStyle;
  if (data.preferredStudyTime) profile.preferredStudyTime = data.preferredStudyTime;
  if (data.timeZone !== undefined) {
    profile.timeZone = data.timeZone || '';
    user.timezone = data.timeZone || '';
  }
  if (data.dailyStudyHours !== undefined) profile.dailyStudyHours = Number(data.dailyStudyHours || 0);
  if (data.bio !== undefined) profile.bio = data.bio || '';

  if (data.profileVisibility) profile.profileVisibility = data.profileVisibility;

  await user.save();
  await profile.save();

  return {
    user,
    profile,
  };
};

const updateProfilePicture = async ({ userId, file }) => {
  const { user, profile } = await getOrCreateProfile(userId);

  if (!file) {
    throw new AppError('Profile picture is required', 400);
  }

  const uploadedFile = await uploadImage(file, {
    folder: 'autonomous-study-planner/profile-pictures',
  });

  if (profile.profilePicture?.publicId) {
    await deleteFile(profile.profilePicture.publicId);
  }

  profile.profilePicture = {
    url: uploadedFile.secure_url,
    publicId: uploadedFile.public_id,
    uploadedAt: new Date(),
  };

  user.avatarUrl = uploadedFile.secure_url;

  await user.save();
  await profile.save();

  return {
    user,
    profile,
  };
};

const deleteProfilePicture = async ({ userId }) => {
  const { user, profile } = await getOrCreateProfile(userId);

  if (profile.profilePicture?.publicId) {
    await deleteFile(profile.profilePicture.publicId);
  }

  profile.profilePicture = { url: '', publicId: '', uploadedAt: null };
  user.avatarUrl = '';

  await user.save();
  await profile.save();

  return {
    user,
    profile,
  };
};

const updateSettings = async ({ userId, data }) => {
  const { user, profile } = await getOrCreateProfile(userId);

  const nextSettings = profile.settings.toObject ? profile.settings.toObject() : { ...profile.settings };

  Object.entries(buildProfileSettings(data)).forEach(([key, value]) => {
    if (value !== undefined) {
      nextSettings[key] = value;
    }
  });

  profile.settings = nextSettings;

  if (data.theme) {
    user.preferences.themePreference = data.theme;
  }

  if (data.language) {
    user.locale = data.language;
  }

  await user.save();
  await profile.save();

  return {
    user,
    profile,
  };
};

const getPrivateProfile = async ({ userId, viewerUser }) => {
  const { user, profile } = await getOrCreateProfile(userId);

  if (String(viewerUser._id || viewerUser.id) !== String(userId) && !(Array.isArray(viewerUser.roles) && viewerUser.roles.includes('Admin'))) {
    throw new AppError('You do not have permission to view this profile', 403);
  }

  return {
    profile: buildPrivateProfile(profile, user),
  };
};

const getCurrentProfile = async ({ userId }) => {
  const { user, profile } = await getOrCreateProfile(userId);

  return {
    profile: buildPrivateProfile(profile, user),
  };
};

const getPublicProfile = async ({ userId, viewerUser = null }) => {
  const { user, profile } = await getOrCreateProfile(userId);

  const isOwner = viewerUser && String(viewerUser._id || viewerUser.id) === String(userId);
  const isAdmin = viewerUser && Array.isArray(viewerUser.roles) && viewerUser.roles.includes('Admin');

  if (profile.profileVisibility === PROFILE_VISIBILITY.PRIVATE && !isOwner && !isAdmin) {
    throw new AppError('Public profile is not available', 404);
  }

  return {
    profile: buildPublicProfile(profile),
  };
};

module.exports = {
  getOrCreateProfile,
  updateProfile,
  updateProfilePicture,
  deleteProfilePicture,
  updateSettings,
  getPrivateProfile,
  getCurrentProfile,
  getPublicProfile,
};
