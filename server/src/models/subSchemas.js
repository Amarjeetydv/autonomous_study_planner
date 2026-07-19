const mongoose = require('mongoose');

const qualificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    institution: { type: String },
    year: { type: Number },
  },
  { _id: false }
);

const availabilitySlotSchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    targetDate: { type: Date },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const successMetricSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    targetValue: { type: Number },
    achievedValue: { type: Number, default: 0 },
  },
  { _id: false }
);

const planSubjectSchema = new mongoose.Schema(
  {
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subjects', required: true },
    focusHours: { type: Number, default: 0 },
  },
  { _id: false }
);

const planTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    status: { type: String, default: 'pending' },
  },
  { _id: false }
);

const planDaySchema = new mongoose.Schema(
  {
    dayNumber: { type: Number, required: true },
    date: { type: Date },
    focusArea: { type: String },
    studyGoal: { type: String },
    completionStatus: { type: String, default: 'pending' },
    tasks: { type: [planTaskSchema], default: [] },
  },
  { _id: false }
);

const checkpointSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    dueDate: { type: Date },
    isDone: { type: Boolean, default: false },
  },
  { _id: false }
);

const revisionEntrySchema = new mongoose.Schema(
  {
    revisionNote: { type: String, required: true },
    revisedAt: { type: Date, default: Date.now },
    revisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
  },
  { _id: false }
);

const checklistItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const progressInsightSchema = new mongoose.Schema(
  {
    label: { type: String },
    value: { type: String },
  },
  { _id: false }
);

const progressTrendSchema = new mongoose.Schema(
  {
    direction: { type: String },
    delta: { type: Number, default: 0 },
  },
  { _id: false }
);

const notificationMetadataSchema = new mongoose.Schema(
  {
    priority: { type: String, default: 'normal' },
    actionUrl: { type: String },
  },
  { _id: false }
);

const recurrenceSchema = new mongoose.Schema(
  {
    frequency: { type: String },
    interval: { type: Number, default: 1 },
    until: { type: Date },
  },
  { _id: false }
);

const chatParticipantSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
  },
  { _id: false }
);

const quizOptionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

const quizQuestionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    questionType: { type: String, default: 'mcq' },
    options: { type: [quizOptionSchema], default: [] },
    explanation: { type: String },
    marks: { type: Number, default: 1 },
  },
  { _id: false }
);

const quizAnswerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    answer: { type: mongoose.Schema.Types.Mixed },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    feedback: { type: String },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    reviewedAt: { type: Date },
  },
  { _id: false }
);

const aiAnalysisSchema = new mongoose.Schema(
  {
    summary: { type: String },
    recommendation: { type: String },
  },
  { _id: false }
);

module.exports = {
  qualificationSchema,
  availabilitySlotSchema,
  milestoneSchema,
  successMetricSchema,
  planSubjectSchema,
  planDaySchema,
  checkpointSchema,
  revisionEntrySchema,
  checklistItemSchema,
  progressInsightSchema,
  progressTrendSchema,
  notificationMetadataSchema,
  recurrenceSchema,
  chatParticipantSchema,
  quizQuestionSchema,
  quizAnswerSchema,
  reviewSchema,
  aiAnalysisSchema,
};
