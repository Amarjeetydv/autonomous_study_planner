const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    roles: { type: [String], enum: ['Student', 'Mentor', 'Admin'], default: ['Student'] },
    status: { type: String, enum: ['active', 'suspended', 'pendingVerification'], default: 'active' },
    emailVerifiedAt: { type: Date, default: null },
    isVerified: { type: Boolean, default: false },
    passwordChangedAt: { type: Date, default: null, select: false },
    refreshTokenHash: { type: String, select: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    avatarUrl: { type: String },
    phone: { type: String },
    timezone: { type: String },
    locale: { type: String, default: 'en' },
    lastLoginAt: { type: Date },
    onboardingCompleted: { type: Boolean, default: false },
    preferences: {
      studyHours: { type: Number, default: 0 },
      notificationPreferences: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: false },
      },
      themePreference: { type: String, default: 'system' },
    },
    mentorProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentors' },
  },
  { timestamps: true, collection: 'Users' }
);

module.exports = mongoose.model('Users', userSchema);
