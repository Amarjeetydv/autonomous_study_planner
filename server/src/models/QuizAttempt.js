const mongoose = require('mongoose');
const { quizAnswerSchema, reviewSchema } = require('./subSchemas');

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, index: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    score: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 }, // percentage of correct questions (0-100)
    completionTime: { type: Number, default: 0 }, // duration in seconds
    timePerQuestion: { type: Number, default: 0 }, // average seconds spent per question
    correctAnswers: { type: Number, default: 0 },
    incorrectAnswers: { type: Number, default: 0 },
    skippedAnswers: { type: Number, default: 0 },
    weakConcepts: [{ type: String }],
    aiFeedback: { type: String, default: '' },
    masteryChanges: {
      oldScore: { type: Number, default: 0 },
      newScore: { type: Number, default: 0 },
    },
    answers: { type: [quizAnswerSchema], default: [] },
    review: { type: reviewSchema, default: {} },
  },
  { timestamps: true, collection: 'QuizAttempts' }
);

module.exports = mongoose.model('QuizAttempts', quizAttemptSchema);
