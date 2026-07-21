const mongoose = require('mongoose');

const aiTokenUsageSchema = new mongoose.Schema(
  {
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
  },
  { _id: false }
);

const aiMetadataSchema = new mongoose.Schema(
  {
    provider: { type: String, default: 'gemini' },
    model: { type: String, default: 'gemini-2.5-flash' },
    temperature: { type: Number, default: 0.4 },
    retries: { type: Number, default: 0 },
    streamed: { type: Boolean, default: false },
    promptVersions: { type: mongoose.Schema.Types.Mixed, default: {} },
    stageUsage: { type: mongoose.Schema.Types.Mixed, default: {} },
    safetySettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    tokenUsage: { type: aiTokenUsageSchema, default: () => ({}) },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const aiPlanSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, index: true },
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goals', required: true, index: true },
    studyPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlans' },
    progressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Progress' },
    status: { type: String, enum: ['draft', 'generating', 'active', 'completed', 'archived'], default: 'active', index: true },
    isCurrent: { type: Boolean, default: true, index: true },
    promptVersion: { type: String, default: '2026-07-09.1' },
    generatedAt: { type: Date, default: Date.now, index: true },
    goalAnalysis: { type: mongoose.Schema.Types.Mixed, default: {} },
    studyPlan: { type: mongoose.Schema.Types.Mixed, default: {} },
    scheduler: { type: mongoose.Schema.Types.Mixed, default: {} },
    quizPlan: { type: mongoose.Schema.Types.Mixed, default: {} },
    motivation: { type: mongoose.Schema.Types.Mixed, default: {} },
    progressAnalysis: { type: mongoose.Schema.Types.Mixed, default: {} },
    dailyTasks: { type: [mongoose.Schema.Types.Mixed], default: [] },
    weeklyTasks: { type: [mongoose.Schema.Types.Mixed], default: [] },
    monthlyTasks: { type: [mongoose.Schema.Types.Mixed], default: [] },
    revisionPlan: { type: [mongoose.Schema.Types.Mixed], default: [] },
    quizSchedule: { type: [mongoose.Schema.Types.Mixed], default: [] },
    aiMetadata: { type: aiMetadataSchema, default: () => ({}) },
  },
  { timestamps: true, collection: 'AIPlans' }
);

aiPlanSchema.index({ studentId: 1, goalId: 1, generatedAt: -1 });

module.exports = mongoose.model('AIPlans', aiPlanSchema);
