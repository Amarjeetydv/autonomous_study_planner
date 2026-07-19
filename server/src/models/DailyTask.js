const mongoose = require('mongoose');

const dailyTaskSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, index: true },
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goals', required: true, index: true },
    studyPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlans', index: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'AIPlans', index: true }, // reference to AIPlan
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subjects' },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    taskType: {
      type: String,
      required: true,
      enum: ['Study', 'Revision', 'Mock Test', 'Practice'],
      default: 'Study',
    },
    scheduledDate: { type: Date, required: true, index: true }, // dueDate replacement
    estimatedDuration: { type: Number, default: 0 }, // estimatedMinutes
    actualStudyTime: { type: Number, default: 0 }, // actualMinutes
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Mixed'], default: 'Intermediate' },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Missed', 'Skipped'],
      default: 'Pending',
      index: true,
    },
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
    notes: { type: String, default: '' },
    aiGenerated: { type: Boolean, default: true },
    rescheduledFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyTasks', default: null },
  },
  { timestamps: true, collection: 'DailyTasks' }
);

module.exports = mongoose.model('DailyTasks', dailyTaskSchema);
