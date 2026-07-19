const mongoose = require('mongoose');
const { quizQuestionSchema } = require('./subSchemas');

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subjects', required: true, index: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topics', index: true },
    studyPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlans' },
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goals', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' }, // mapped from difficultyLevel
    estimatedTime: { type: Number, default: 15 }, // mapped from timeLimitMinutes (in minutes)
    generatedByAI: { type: Boolean, default: true },
    questions: { type: [quizQuestionSchema], default: [] },
  },
  { timestamps: true, collection: 'Quiz' }
);

module.exports = mongoose.model('Quiz', quizSchema);
