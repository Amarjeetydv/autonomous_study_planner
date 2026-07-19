const mongoose = require('mongoose');

const mentorFeedbackSchema = new mongoose.Schema(
  {
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, index: true },
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goals', required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyPlans', required: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyTasks', default: null },
    comment: { type: String, required: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
  },
  { timestamps: true, collection: 'MentorFeedbacks' }
);

module.exports = mongoose.model('MentorFeedback', mentorFeedbackSchema);
