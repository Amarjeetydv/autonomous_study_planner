const mongoose = require('mongoose');

const mentorStudentSchema = new mongoose.Schema(
  {
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, index: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    invitedAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'MentorStudents' }
);

// Prevent duplicate links/requests
mentorStudentSchema.index({ mentorId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('MentorStudent', mentorStudentSchema);
