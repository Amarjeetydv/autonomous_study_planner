const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
  {
    targetType: { type: String, enum: ['subject', 'topic'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    recommendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, index: true },
    note: { type: String, default: '' },
  },
  { timestamps: true, collection: 'Recommendations' }
);

recommendationSchema.index({ targetType: 1, targetId: 1, recommendedBy: 1 }, { unique: true });

module.exports = mongoose.model('Recommendations', recommendationSchema);
