const mongoose = require('mongoose');

const mentorFeedbackSchema = new mongoose.Schema(
  {
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, index: true },
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goals', default: null },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlans', default: null },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyTasks', default: null },
    comment: { type: String, default: '' },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    strengths: { type: String, default: '' },
    weaknesses: { type: String, default: '' },
    recommendations: { type: String, default: '' },
    deadlineSuggestions: { type: String, default: '' },
  },
  { timestamps: true, collection: 'MentorFeedbacks' }
);

module.exports = mongoose.model('MentorFeedback', mentorFeedbackSchema);
