const { PROFILE_VISIBILITY } = require('./profile.constants');

const normalizeProfileArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const buildProfileSettings = (settings = {}) => ({
  emailNotifications: settings.emailNotifications,
  pushNotifications: settings.pushNotifications,
  reminderTime: settings.reminderTime,
  theme: settings.theme,
  language: settings.language,
});

const buildPublicProfile = (profile) => ({
  userId: profile.userId,
  fullName: profile.fullName,
  profilePicture: profile.profilePicture,
  education: profile.education,
  college: profile.college,
  university: profile.university,
  skills: profile.skills,
  interests: profile.interests,
  learningStyle: profile.learningStyle,
  preferredStudyTime: profile.preferredStudyTime,
  timeZone: profile.timeZone,
  dailyStudyHours: profile.dailyStudyHours,
  bio: profile.bio,
  profileVisibility: profile.profileVisibility,
});

const buildPrivateProfile = (profile, user) => ({
  ...buildPublicProfile(profile),
  phoneNumber: profile.phoneNumber,
  dateOfBirth: profile.dateOfBirth,
  gender: profile.gender,
  settings: profile.settings,
  account: {
    email: user.email,
    roles: user.roles,
    status: user.status,
  },
  createdAt: profile.createdAt,
  updatedAt: profile.updatedAt,
});

const isPrivateAccessAllowed = ({ viewerUser, targetUserId, profileVisibility }) => {
  if (profileVisibility === PROFILE_VISIBILITY.PUBLIC) {
    return true;
  }

  if (!viewerUser) {
    return false;
  }

  const viewerId = String(viewerUser._id || viewerUser.id);
  const isOwner = viewerId === String(targetUserId);
  const isAdmin = Array.isArray(viewerUser.roles) && viewerUser.roles.includes('Admin');

  return isOwner || isAdmin;
};

module.exports = {
  normalizeProfileArray,
  buildProfileSettings,
  buildPublicProfile,
  buildPrivateProfile,
  isPrivateAccessAllowed,
};
