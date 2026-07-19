const mongoose = require('mongoose');
const { qualificationSchema, availabilitySlotSchema } = require('./subSchemas');

const mentorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, unique: true },
    bio: { type: String },
    expertiseAreas: { type: [String], default: [] },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subjects' }],
    experienceYears: { type: Number, default: 0 },
    qualifications: { type: [qualificationSchema], default: [] },
    verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    hourlyAvailability: { type: [availabilitySlotSchema], default: [] },
    studentsAssigned: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }],
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    workingMode: { type: String, enum: ['online', 'hybrid', 'offline'], default: 'online' },
    mentorType: { type: String, enum: ['internal', 'external'], default: 'internal' },
  },
  { timestamps: true, collection: 'Mentors' }
);

module.exports = mongoose.model('Mentors', mentorSchema);
