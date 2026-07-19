const mongoose = require('mongoose');

const dailyCheckInSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, index: true },
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goals', required: true },
    date: { type: Date, required: true, index: true },
    plannedStudyHours: { type: Number, default: 0 },
    actualStudyHours: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    missedTasks: { type: Number, default: 0 },
    skippedTasks: { type: Number, default: 0 },
    mood: { 
      type: String, 
      enum: ['Excellent', 'Good', 'Neutral', 'Stressed', 'Burnout'], 
      required: true 
    },
    energyLevel: { type: Number, min: 1, max: 5, required: true },
    focusLevel: { type: Number, min: 1, max: 5, required: true },
    confidenceLevel: { type: Number, min: 1, max: 5, required: true },
    difficultyLevel: { type: Number, min: 1, max: 5, required: true },
    productivityRating: { type: Number, min: 1, max: 5, required: true },
    blockers: [{ type: String }],
    notes: { type: String, default: '' },
    aiInsights: {
      summary: { type: String, default: '' },
      insights: [{ type: String }],
      weakTrends: [{ type: String }],
      suggestions: [{ type: String }],
      hourAdjustment: { type: Number, default: 0 },
      motivation: { type: String, default: '' },
    },
  },
  { timestamps: true, collection: 'DailyCheckIns' }
);

// Enforce unique check-in per user per day
dailyCheckInSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyCheckIn', dailyCheckInSchema);
