const mongoose = require('mongoose');

const knowledgeMasterySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, index: true },
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goals', required: true, index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subjects', required: true, index: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topics', index: true },
    subtopicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subtopics', index: true },
    masteryScore: { type: Number, default: 0, min: 0, max: 100 },
    confidenceScore: { type: Number, default: 1, min: 1, max: 5 },
    revisionCount: { type: Number, default: 0 },
    lastRevisionDate: { type: Date, default: null },
    nextRevisionDate: { type: Date, default: null },
    quizAttempts: { type: Number, default: 0 },
    averageQuizScore: { type: Number, default: 0 },
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
    estimatedRetention: { type: Number, default: 100, min: 0, max: 100 },
    forgettingCurveFactor: { type: Number, default: 1 }, // half-life indicator multiplier
    aiRecommendation: { type: String, default: 'Study basic definitions to build core baseline.' },
  },
  { timestamps: true, collection: 'KnowledgeMastery' }
);

// Enforce unique record per user per subject/topic to track mastery accurately
knowledgeMasterySchema.index({ userId: 1, subjectId: 1, topicId: 1 }, { unique: true });

module.exports = mongoose.model('KnowledgeMastery', knowledgeMasterySchema);
