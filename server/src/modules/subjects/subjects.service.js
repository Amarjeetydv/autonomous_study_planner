const AppError = require('../../utils/AppError');
const { buildListQuery, buildPagination } = require('../../services/query.service');
const Subject = require('../../models/Subject');
const Topic = require('../../models/Topic');
const Subtopic = require('../../models/Subtopic');
const TopicProgress = require('../../models/TopicProgress');
const Recommendation = require('../../models/Recommendation');
const { buildSubjectView, buildTopicView, buildSubtopicView } = require('./subjects.utils');
const { parseBooleanValue } = require('./subjects.utils');
const { RECOMMENDATION_TARGET_TYPES, DEFAULT_TOPIC_SORT_FIELD, DEFAULT_SUBTOPIC_SORT_FIELD } = require('./subjects.constants');

const buildSubjectFilters = (query = {}) => ({
  category: query.category,
  difficulty: query.difficulty,
  isActive: parseBooleanValue(query.isActive),
});

const buildTopicFilters = (query = {}) => ({
  difficulty: query.difficulty,
  isActive: parseBooleanValue(query.isActive),
});

const buildProgressFilters = (query = {}) => ({
  subjectId: query.subjectId,
  completed: parseBooleanValue(query.completed),
  bookmarked: parseBooleanValue(query.bookmarked),
});

const listSubjects = async (query = {}) => {
  const { query: mongoQuery, sortQuery, pagination } = buildListQuery({
    keyword: query.keyword || query.search,
    searchFields: ['name', 'code', 'category', 'description', 'difficulty', 'color', 'icon'],
    filters: buildSubjectFilters(query),
    sortBy: query.sortBy || 'name',
    sortOrder: query.sortOrder || 'asc',
    page: query.page,
    limit: query.limit,
  });

  const [totalItems, subjects] = await Promise.all([
    Subject.countDocuments(mongoQuery),
    Subject.find(mongoQuery).sort(sortQuery).skip(pagination.skip).limit(pagination.limit).lean(),
  ]);

  return {
    items: subjects.map(buildSubjectView),
    pagination: buildPagination({ page: pagination.page, limit: pagination.limit, totalItems }),
  };
};

const createSubject = async ({ data, userId }) => {
  const existingSubject = await Subject.findOne({ code: data.code.toUpperCase() });

  if (existingSubject) {
    throw new AppError('Subject code already exists', 409);
  }

  const subject = await Subject.create({
    ...data,
    code: data.code.toUpperCase(),
    createdBy: userId,
    updatedBy: userId,
  });

  return buildSubjectView(subject);
};

const getSubjectById = async (subjectId) => {
  const subject = await Subject.findById(subjectId).lean();

  if (!subject) {
    throw new AppError('Subject not found', 404);
  }

  const topics = await Topic.find({ subjectId, isActive: true }).sort({ order: 1 }).lean();

  return {
    subject: buildSubjectView(subject),
    topics: topics.map(buildTopicView),
  };
};

const updateSubject = async ({ subjectId, data, userId }) => {
  const subject = await Subject.findById(subjectId);

  if (!subject) {
    throw new AppError('Subject not found', 404);
  }

  if (data.code && data.code.toUpperCase() !== subject.code) {
    const existingSubject = await Subject.findOne({ code: data.code.toUpperCase(), _id: { $ne: subjectId } });

    if (existingSubject) {
      throw new AppError('Subject code already exists', 409);
    }
  }

  Object.assign(subject, {
    ...data,
    code: data.code ? data.code.toUpperCase() : subject.code,
    updatedBy: userId,
  });

  await subject.save();
  return buildSubjectView(subject);
};

const deleteSubject = async (subjectId) => {
  const subject = await Subject.findById(subjectId);

  if (!subject) {
    throw new AppError('Subject not found', 404);
  }

  const topics = await Topic.find({ subjectId }).select('_id');
  const topicIds = topics.map((topic) => topic._id);

  await Promise.all([
    Subtopic.deleteMany({ topicId: { $in: topicIds } }),
    TopicProgress.deleteMany({ subjectId }),
    Recommendation.deleteMany({ targetType: RECOMMENDATION_TARGET_TYPES.SUBJECT, targetId: subjectId }),
    Recommendation.deleteMany({ targetType: RECOMMENDATION_TARGET_TYPES.TOPIC, targetId: { $in: topicIds } }),
    Topic.deleteMany({ subjectId }),
    subject.deleteOne(),
  ]);

  return { deleted: true };
};

const listTopicsBySubject = async ({ subjectId, query = {} }) => {
  const subject = await Subject.findById(subjectId).lean();

  if (!subject) {
    throw new AppError('Subject not found', 404);
  }

  const { query: mongoQuery, sortQuery, pagination } = buildListQuery({
    keyword: query.keyword || query.search,
    searchFields: ['name', 'description', 'difficulty'],
    filters: { ...buildTopicFilters(query), subjectId },
    sortBy: query.sortBy || DEFAULT_TOPIC_SORT_FIELD,
    sortOrder: query.sortOrder || 'asc',
    page: query.page,
    limit: query.limit,
  });

  const [totalItems, topics] = await Promise.all([
    Topic.countDocuments(mongoQuery),
    Topic.find(mongoQuery).sort(sortQuery).skip(pagination.skip).limit(pagination.limit).lean(),
  ]);

  return {
    subject: buildSubjectView(subject),
    items: topics.map(buildTopicView),
    pagination: buildPagination({ page: pagination.page, limit: pagination.limit, totalItems }),
  };
};

const createTopic = async ({ subjectId, data, userId }) => {
  const subject = await Subject.findById(subjectId);

  if (!subject) {
    throw new AppError('Subject not found', 404);
  }

  const nextOrder = data.order || ((await Topic.countDocuments({ subjectId })) + 1);

  const topic = await Topic.create({
    subjectId,
    ...data,
    order: nextOrder,
    createdBy: userId,
    updatedBy: userId,
  });

  return buildTopicView(topic);
};

const getTopicById = async (topicId) => {
  const topic = await Topic.findById(topicId).lean();

  if (!topic) {
    throw new AppError('Topic not found', 404);
  }

  const subtopics = await Subtopic.find({ topicId, isActive: true }).sort({ order: 1 }).lean();

  return {
    topic: buildTopicView(topic),
    subtopics: subtopics.map(buildSubtopicView),
  };
};

const updateTopic = async ({ topicId, data, userId }) => {
  const topic = await Topic.findById(topicId);

  if (!topic) {
    throw new AppError('Topic not found', 404);
  }

  Object.assign(topic, {
    ...data,
    updatedBy: userId,
  });

  await topic.save();
  return buildTopicView(topic);
};

const deleteTopic = async (topicId) => {
  const topic = await Topic.findById(topicId);

  if (!topic) {
    throw new AppError('Topic not found', 404);
  }

  await Promise.all([
    Subtopic.deleteMany({ topicId }),
    TopicProgress.deleteMany({ topicId }),
    Recommendation.deleteMany({ targetType: RECOMMENDATION_TARGET_TYPES.TOPIC, targetId: topicId }),
    topic.deleteOne(),
  ]);

  return { deleted: true };
};

const listSubtopicsByTopic = async ({ topicId, query = {} }) => {
  const topic = await Topic.findById(topicId).lean();

  if (!topic) {
    throw new AppError('Topic not found', 404);
  }

  const { query: mongoQuery, sortQuery, pagination } = buildListQuery({
    keyword: query.keyword || query.search,
    searchFields: ['name', 'description', 'learningObjective'],
    filters: { isActive: parseBooleanValue(query.isActive), topicId },
    sortBy: query.sortBy || DEFAULT_SUBTOPIC_SORT_FIELD,
    sortOrder: query.sortOrder || 'asc',
    page: query.page,
    limit: query.limit,
  });

  const [totalItems, subtopics] = await Promise.all([
    Subtopic.countDocuments(mongoQuery),
    Subtopic.find(mongoQuery).sort(sortQuery).skip(pagination.skip).limit(pagination.limit).lean(),
  ]);

  return {
    topic: buildTopicView(topic),
    items: subtopics.map(buildSubtopicView),
    pagination: buildPagination({ page: pagination.page, limit: pagination.limit, totalItems }),
  };
};

const createSubtopic = async ({ topicId, data, userId }) => {
  const topic = await Topic.findById(topicId);

  if (!topic) {
    throw new AppError('Topic not found', 404);
  }

  const nextOrder = data.order || ((await Subtopic.countDocuments({ topicId })) + 1);

  const subtopic = await Subtopic.create({
    topicId,
    ...data,
    order: nextOrder,
    createdBy: userId,
    updatedBy: userId,
  });

  return buildSubtopicView(subtopic);
};

const updateSubtopic = async ({ subtopicId, data, userId }) => {
  const subtopic = await Subtopic.findById(subtopicId);

  if (!subtopic) {
    throw new AppError('Subtopic not found', 404);
  }

  Object.assign(subtopic, {
    ...data,
    updatedBy: userId,
  });

  await subtopic.save();
  return buildSubtopicView(subtopic);
};

const deleteSubtopic = async (subtopicId) => {
  const subtopic = await Subtopic.findById(subtopicId);

  if (!subtopic) {
    throw new AppError('Subtopic not found', 404);
  }

  await subtopic.deleteOne();
  return { deleted: true };
};

const bookmarkTopic = async ({ userId, topicId, bookmarked = true }) => {
  const topic = await Topic.findById(topicId);

  if (!topic) {
    throw new AppError('Topic not found', 404);
  }

  const progress = await TopicProgress.findOneAndUpdate(
    { userId, topicId },
    {
      $set: {
        userId,
        subjectId: topic.subjectId,
        topicId,
        bookmarked,
        bookmarkedAt: bookmarked ? new Date() : null,
        lastAccessedAt: new Date(),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return progress;
};

const completeTopic = async ({ userId, topicId, completed = true }) => {
  const topic = await Topic.findById(topicId);

  if (!topic) {
    throw new AppError('Topic not found', 404);
  }

  const progress = await TopicProgress.findOneAndUpdate(
    { userId, topicId },
    {
      $set: {
        userId,
        subjectId: topic.subjectId,
        topicId,
        completed,
        completedAt: completed ? new Date() : null,
        completionPercentage: completed ? 100 : 0,
        lastAccessedAt: new Date(),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return progress;
};

const listMyProgress = async ({ userId, query = {} }) => {
  const { query: mongoQuery, sortQuery, pagination } = buildListQuery({
    filters: { ...buildProgressFilters(query), userId },
    sortBy: query.sortBy || 'updatedAt',
    sortOrder: query.sortOrder || 'desc',
    page: query.page,
    limit: query.limit,
  });

  const [totalItems, progressEntries, totalTopics, bookmarkedCount, completedCount] = await Promise.all([
    TopicProgress.countDocuments(mongoQuery),
    TopicProgress.find(mongoQuery).sort(sortQuery).skip(pagination.skip).limit(pagination.limit).populate('subjectId').populate('topicId').lean(),
    Topic.countDocuments(query.subjectId ? { subjectId: query.subjectId } : {}),
    TopicProgress.countDocuments({ userId, bookmarked: true, ...(query.subjectId ? { subjectId: query.subjectId } : {}) }),
    TopicProgress.countDocuments({ userId, completed: true, ...(query.subjectId ? { subjectId: query.subjectId } : {}) }),
  ]);

  return {
    items: progressEntries,
    summary: {
      totalTopics,
      bookmarkedCount,
      completedCount,
      completionRate: totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0,
    },
    pagination: buildPagination({ page: pagination.page, limit: pagination.limit, totalItems }),
  };
};

const listBookmarkedTopics = async ({ userId, query = {} }) =>
  listMyProgress({ userId, query: { ...query, bookmarked: true } });

const listCompletedTopics = async ({ userId, query = {} }) =>
  listMyProgress({ userId, query: { ...query, completed: true } });

const recommend = async ({ targetType, targetId, userId, note = '' }) => {
  const recommendation = await Recommendation.findOneAndUpdate(
    { targetType, targetId, recommendedBy: userId },
    {
      $set: {
        targetType,
        targetId,
        recommendedBy: userId,
        note,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return recommendation;
};

module.exports = {
  listSubjects,
  createSubject,
  getSubjectById,
  updateSubject,
  deleteSubject,
  listTopicsBySubject,
  createTopic,
  getTopicById,
  updateTopic,
  deleteTopic,
  listSubtopicsByTopic,
  createSubtopic,
  updateSubtopic,
  deleteSubtopic,
  bookmarkTopic,
  completeTopic,
  listMyProgress,
  listBookmarkedTopics,
  listCompletedTopics,
  recommend,
};
