const mongoose = require('mongoose');

const profilePictureSchema = new mongoose.Schema(
  {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
    uploadedAt: { type: Date, default: null },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    reminderTime: { type: String, default: '08:00' },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    language: { type: String, default: 'en' },
  },
  { _id: false }
);

const userProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    profilePicture: { type: profilePictureSchema, default: {} },
    phoneNumber: { type: String, default: '' },
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'], default: 'prefer_not_to_say' },
    education: { type: String, default: '' },
    college: { type: String, default: '' },
    university: { type: String, default: '' },
    skills: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    learningStyle: {
      type: String,
      enum: ['visual', 'auditory', 'reading', 'kinesthetic', 'mixed'],
      default: 'mixed',
    },
    preferredStudyTime: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night', 'flexible'],
      default: 'flexible',
    },
    timeZone: { type: String, default: '' },
    dailyStudyHours: { type: Number, default: 0, min: 0, max: 24 },
    bio: { type: String, default: '' },
    settings: { type: settingsSchema, default: {} },
    profileVisibility: { type: String, enum: ['public', 'private'], default: 'private' },
  },
  { timestamps: true, collection: 'UserProfiles' }
);

module.exports = mongoose.model('UserProfiles', userProfileSchema);
