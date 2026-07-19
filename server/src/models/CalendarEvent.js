const mongoose = require('mongoose');
const { recurrenceSchema } = require('./subSchemas');

const calendarEventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    eventType: {
      type: String,
      enum: ['studyBlock', 'deadline', 'mentorSession', 'quiz', 'reminder', 'custom'],
      default: 'custom',
    },
    title: { type: String, required: true },
    description: { type: String },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    timezone: { type: String },
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled', 'moved'], default: 'scheduled' },
    sourceType: { type: String, enum: ['plan', 'task', 'quiz', 'mentor', 'custom'], default: 'custom' },
    sourceId: { type: mongoose.Schema.Types.ObjectId },
    recurrence: { type: recurrenceSchema, default: {} },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }],
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'Calendar' }
);

module.exports = mongoose.model('Calendar', calendarEventSchema);
