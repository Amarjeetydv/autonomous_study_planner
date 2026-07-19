const UserLevel = require('../../models/UserLevel');
const UserAchievement = require('../../models/UserAchievement');
const AchievementDefinition = require('../../models/Achievement');

const findUserLevel = async (userId) => {
  return UserLevel.findOne({ userId });
};

const findOrCreateUserLevel = async (userId) => {
  let level = await UserLevel.findOne({ userId });
  if (!level) {
    level = await UserLevel.create({ userId });
  }
  return level;
};

const updateUserLevel = async (userId, data) => {
  return UserLevel.findOneAndUpdate({ userId }, { $set: data }, { new: true });
};

const findAchievements = async () => {
  return AchievementDefinition.find().lean();
};

const findUserAchievements = async (userId) => {
  return UserAchievement.find({ userId })
    .populate('achievementId')
    .lean();
};

const findOrCreateUserAchievement = async (userId, achievementId) => {
  let userAch = await UserAchievement.findOne({ userId, achievementId });
  if (!userAch) {
    userAch = await UserAchievement.create({ userId, achievementId });
  }
  return userAch;
};

const updateUserAchievement = async (userId, achievementId, data) => {
  return UserAchievement.findOneAndUpdate(
    { userId, achievementId },
    { $set: data },
    { new: true }
  );
};

module.exports = {
  findUserLevel,
  findOrCreateUserLevel,
  updateUserLevel,
  findAchievements,
  findUserAchievements,
  findOrCreateUserAchievement,
  updateUserAchievement,
};
