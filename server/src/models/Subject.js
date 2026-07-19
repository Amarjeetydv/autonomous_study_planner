const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    difficulty: { type: String, required: true, trim: true, alias: 'difficultyLevel' },
    color: { type: String, default: '#4f46e5' },
    icon: { type: String, default: '' },
    estimatedHours: { type: Number, default: 0, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'Subjects' }
);

subjectSchema.index({ name: 1 });
subjectSchema.index({ category: 1 });
subjectSchema.index({ difficulty: 1 });
subjectSchema.index({ isActive: 1 });

module.exports = mongoose.model('Subjects', subjectSchema);
