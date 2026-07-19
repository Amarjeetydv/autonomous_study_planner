const mongoose = require('mongoose');
const {
  planSubjectSchema,
  planDaySchema,
  checkpointSchema,
  revisionEntrySchema,
} = require('./subSchemas');

const studyPlanSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goals' },
    title: { type: String, required: true },
    planType: { type: String, enum: ['weekly', 'monthly', 'examPrep', 'custom'], default: 'weekly' },
    status: { type: String, enum: ['draft', 'active', 'paused', 'completed', 'archived'], default: 'draft' },
    startDate: { type: Date },
    endDate: { type: Date },
    subjects: { type: [planSubjectSchema], default: [] },
    planSummary: { type: String },
    generatedBy: { type: String, enum: ['ai', 'mentor', 'student', 'system'], default: 'system' },
    planVersion: { type: Number, default: 1 },
    planDays: { type: [planDaySchema], default: [] },
    checkpoints: { type: [checkpointSchema], default: [] },
    estimatedHours: { type: Number, default: 0 },
    actualHours: { type: Number, default: 0 },
    revisionHistory: { type: [revisionEntrySchema], default: [] },
  },
  { timestamps: true, collection: 'StudyPlans' }
);

module.exports = mongoose.model('StudyPlans', studyPlanSchema);
