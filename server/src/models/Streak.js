const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, unique: true, index: true },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    totalStudyDays: { type: Number, default: 0 },
    lastCheckInDate: { type: Date, default: null },
    weeklyDates: [{ type: Date }], // dates checked in for weekly consistency
  },
  { timestamps: true, collection: 'Streaks' }
);

module.exports = mongoose.model('Streaks', streakSchema);
