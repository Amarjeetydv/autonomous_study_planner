const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    icon: { type: String, default: 'Award' },
    category: {
      type: String,
      enum: ['Beginner', 'Consistency', 'Quiz Master', 'Revision Expert', 'AI Planner', 'Productivity', 'Focus', 'Milestone', 'Hidden Achievements'],
      default: 'Beginner'
    },
    xpReward: { type: Number, default: 100 },
    rarity: { type: String, enum: ['Common', 'Rare', 'Epic', 'Legendary'], default: 'Common' },
    unlockConditions: {
      conditionType: { type: String, required: true }, // e.g. 'streak', 'quiz_perfect', 'plan_count', 'task_count', 'checkin_count'
      targetValue: { type: Number, required: true },
    }
  },
  { timestamps: true, collection: 'AchievementDefinitions' }
);

module.exports = mongoose.model('AchievementDefinition', achievementSchema);
