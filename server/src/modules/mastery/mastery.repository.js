const KnowledgeMastery = require('../../models/KnowledgeMastery');

const upsert = async (userId, subjectId, topicId, data) => {
  return KnowledgeMastery.findOneAndUpdate(
    { userId, subjectId, topicId },
    { $set: data },
    { new: true, upsert: true }
  );
};

const find = async (query = {}, populateFields = 'subjectId topicId', sort = { masteryScore: 1 }) => {
  return KnowledgeMastery.find(query)
    .sort(sort)
    .populate('subjectId', 'name code color')
    .populate('topicId', 'name code description')
    .lean();
};

const findOne = async (query) => {
  return KnowledgeMastery.findOne(query)
    .populate('subjectId', 'name code color')
    .populate('topicId', 'name code description');
};

const findById = async (id) => {
  return KnowledgeMastery.findById(id)
    .populate('subjectId', 'name code color')
    .populate('topicId', 'name code description');
};

const findWeakTopics = async (userId, limitScore = 50) => {
  return KnowledgeMastery.find({
    userId,
    masteryScore: { $lt: limitScore },
  })
    .sort({ masteryScore: 1 })
    .populate('subjectId', 'name code color')
    .populate('topicId', 'name code description')
    .lean();
};

const findRevisionQueue = async (userId) => {
  const now = new Date();
  return KnowledgeMastery.find({
    userId,
    nextRevisionDate: { $lte: now },
  })
    .sort({ nextRevisionDate: 1 })
    .populate('subjectId', 'name code color')
    .populate('topicId', 'name code description')
    .lean();
};

module.exports = {
  upsert,
  find,
  findOne,
  findById,
  findWeakTopics,
  findRevisionQueue,
};
