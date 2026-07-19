const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, index: true },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', index: true },
    title: { type: String, required: true, trim: true },
    goalType: {
      type: String,
      required: true,
      trim: true,
      enum: ['GATE', 'CAT', 'UPSC', 'PLACEMENT', 'SEMESTER_EXAM', 'SKILL_LEARNING', 'CUSTOM'],
      index: true,
    },
    targetDate: { type: Date, required: true, index: true },
    currentLevel: { type: String, required: true, enum: ['Beginner', 'Intermediate', 'Advanced'] },
    dailyStudyHours: { type: Number, required: true, min: 0, max: 24 },
    weeklyStudyDays: { type: Number, required: true, min: 1, max: 7 },
    preferredStudyTime: {
      type: String,
      required: true,
      enum: ['Morning', 'Afternoon', 'Evening', 'Night', 'Flexible'],
    },
    preferredSessionLengthMinutes: { type: Number, required: true, min: 15, max: 480 },
    strongSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subjects' }],
    weakSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subjects' }],
    selectedSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subjects', required: true }],
    prioritySubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subjects' }],
    difficultyPreference: {
      type: String,
      required: true,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Mixed'],
    },
    learningStyle: {
      type: String,
      required: true,
      enum: ['Visual', 'Reading', 'Hands-on', 'Video', 'Text', 'Mixed'],
    },
    targetScore: { type: Number, default: null, min: 0 },
    motivation: { type: String, default: '' },
    breakDays: { type: [String], default: [] },
    vacationDays: {
      type: [
        {
          startDate: { type: Date, required: true },
          endDate: { type: Date, required: true },
          note: { type: String, default: '' },
        },
      ],
      default: [],
    },
    timezone: { type: String, required: true },
    language: { type: String, required: true, default: 'en' },
    reminderPreference: {
      isEnabled: { type: Boolean, default: true },
      mode: { type: String, enum: ['In-App', 'Email', 'Push', 'SMS', 'Mixed'], default: 'In-App' },
      reminderTime: { type: String, default: '08:00' },
      frequency: { type: String, enum: ['Daily', 'Weekdays', 'Custom'], default: 'Daily' },
    },
    calendarPreference: {
      isEnabled: { type: Boolean, default: true },
      includeWeekends: { type: Boolean, default: false },
      includeBreakDays: { type: Boolean, default: true },
      color: { type: String, default: '#4f46e5' },
    },
    status: { type: String, enum: ['active', 'paused', 'completed', 'archived'], default: 'active', index: true },
    pausedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    source: { type: String, enum: ['student', 'mentor', 'admin'], default: 'student' },
  },
  { timestamps: true, collection: 'Goals' }
);

goalSchema.index({ studentId: 1, goalType: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'active' } });
goalSchema.index({ studentId: 1, status: 1 });
goalSchema.index({ studentId: 1, targetDate: 1 });
goalSchema.index({ goalType: 1, status: 1 });
goalSchema.index({ title: 'text', goalType: 'text', motivation: 'text' });

module.exports = mongoose.model('Goals', goalSchema);
