const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema(
  {
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subjects', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    order: { type: Number, required: true, default: 1 },
    difficulty: { type: String, required: true, trim: true },
    estimatedTimeMinutes: { type: Number, default: 0, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'Topics' }
);

topicSchema.index({ subjectId: 1, order: 1 }, { unique: true });
topicSchema.index({ subjectId: 1, name: 1 }, { unique: true });
topicSchema.index({ difficulty: 1 });
topicSchema.index({ isActive: 1 });

module.exports = mongoose.model('Topics', topicSchema);
