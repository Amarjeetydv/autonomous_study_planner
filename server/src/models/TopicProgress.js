const mongoose = require('mongoose');

const topicProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subjects', required: true, index: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topics', required: true, index: true },
    bookmarked: { type: Boolean, default: false },
    bookmarkedAt: { type: Date, default: null },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
    lastAccessedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'TopicProgress' }
);

topicProgressSchema.index({ userId: 1, topicId: 1 }, { unique: true });
topicProgressSchema.index({ userId: 1, bookmarked: 1 });
topicProgressSchema.index({ userId: 1, completed: 1 });

module.exports = mongoose.model('TopicProgress', topicProgressSchema);
