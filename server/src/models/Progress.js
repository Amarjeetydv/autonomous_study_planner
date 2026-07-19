const mongoose = require('mongoose');
const { progressInsightSchema, progressTrendSchema } = require('./subSchemas');

const progressSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subjects' },
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goals' },
    studyPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlans' },
    progressType: { type: String, enum: ['daily', 'weekly', 'subject', 'goal', 'overall'], default: 'daily' },
    completionRate: { type: Number, default: 0 },
    streakCount: { type: Number, default: 0 },
    studyHours: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    tasksMissed: { type: Number, default: 0 },
    quizScoreAverage: { type: Number, default: 0 },
    mentorFeedbackScore: { type: Number, default: 0 },
    insights: { type: [progressInsightSchema], default: [] },
    snapshotDate: { type: Date, default: Date.now },
    trend: { type: progressTrendSchema, default: null },
  },
  { timestamps: true, collection: 'Progress' }
);

module.exports = mongoose.model('Progress', progressSchema);
