const mongoose = require('mongoose');

const userAchievementSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, index: true },
    achievementId: { type: mongoose.Schema.Types.ObjectId, ref: 'AchievementDefinition', required: true },
    unlockedAt: { type: Date, default: null },
    progress: { type: Number, default: 0 },
    claimed: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'UserAchievements' }
);

userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

module.exports = mongoose.model('UserAchievement', userAchievementSchema);
