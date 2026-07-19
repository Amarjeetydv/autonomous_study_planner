const mongoose = require('mongoose');

const userLevelSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, unique: true, index: true },
    currentLevel: { type: Number, default: 1 },
    totalXP: { type: Number, default: 0 },
    currentXP: { type: Number, default: 0 },
    nextLevelXP: { type: Number, default: 1000 }, // level threshold (e.g. currentLevel * 1000)
  },
  { timestamps: true, collection: 'UserLevels' }
);

module.exports = mongoose.model('UserLevel', userLevelSchema);
