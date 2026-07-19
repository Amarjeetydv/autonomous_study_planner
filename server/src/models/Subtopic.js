const mongoose = require('mongoose');

const subtopicSchema = new mongoose.Schema(
  {
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topics', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    learningObjective: { type: String, default: '' },
    order: { type: Number, default: 1 },
    estimatedTimeMinutes: { type: Number, default: 0, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'Subtopics' }
);

subtopicSchema.index({ topicId: 1, order: 1 }, { unique: true });
subtopicSchema.index({ topicId: 1, name: 1 }, { unique: true });
subtopicSchema.index({ isActive: 1 });

module.exports = mongoose.model('Subtopics', subtopicSchema);
