const asyncHandler = require('../../middlewares/asyncHandler');
const { sendResponse, sendPaginatedResponse } = require('../../utils/response');
const {
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
} = require('./subjects.service');
const { RECOMMENDATION_TARGET_TYPES } = require('./subjects.constants');

const listSubjectsController = asyncHandler(async (req, res) => {
  const result = await listSubjects(req.query);

  return sendPaginatedResponse(
    res,
    {
      message: 'Subjects fetched successfully',
      items: result.items,
      pagination: result.pagination,
    },
    200
  );
});

const createSubjectController = asyncHandler(async (req, res) => {
  const subject = await createSubject({ data: req.body, userId: req.user._id || req.user.id });

  return sendResponse(
    res,
    {
      success: true,
      message: 'Subject created successfully',
      data: { subject },
      errors: []
    },
    201
  );
});

const getSubjectController = asyncHandler(async (req, res) => {
  const result = await getSubjectById(req.params.subjectId);

  return sendResponse(res, {
    success: true,
    message: 'Subject fetched successfully',
    data: result,
    errors: [],
  });
});

const updateSubjectController = asyncHandler(async (req, res) => {
  const subject = await updateSubject({ subjectId: req.params.subjectId, data: req.body, userId: req.user._id || req.user.id });

  return sendResponse(res, {
    success: true,
    message: 'Subject updated successfully',
    data: { subject },
    errors: [],
  });
});

const deleteSubjectController = asyncHandler(async (req, res) => {
  await deleteSubject(req.params.subjectId);

  return sendResponse(res, {
    success: true,
    message: 'Subject deleted successfully',
    data: null,
    errors: [],
  });
});

const listTopicsBySubjectController = asyncHandler(async (req, res) => {
  const result = await listTopicsBySubject({ subjectId: req.params.subjectId, query: req.query });

  return sendPaginatedResponse(
    res,
    {
      message: 'Topics fetched successfully',
      items: result.items,
      pagination: result.pagination,
    },
    200
  );
});

const createTopicController = asyncHandler(async (req, res) => {
  const topic = await createTopic({ subjectId: req.params.subjectId, data: req.body, userId: req.user._id || req.user.id });

  return sendResponse(res, {
    success: true,
    message: 'Topic created successfully',
    data: { topic },
    errors: [],
  }, 201);
});

const getTopicController = asyncHandler(async (req, res) => {
  const result = await getTopicById(req.params.topicId);

  return sendResponse(res, {
    success: true,
    message: 'Topic fetched successfully',
    data: result,
    errors: [],
  });
});

const updateTopicController = asyncHandler(async (req, res) => {
  const topic = await updateTopic({ topicId: req.params.topicId, data: req.body, userId: req.user._id || req.user.id });

  return sendResponse(res, {
    success: true,
    message: 'Topic updated successfully',
    data: { topic },
    errors: [],
  });
});

const deleteTopicController = asyncHandler(async (req, res) => {
  await deleteTopic(req.params.topicId);

  return sendResponse(res, {
    success: true,
    message: 'Topic deleted successfully',
    data: null,
    errors: [],
  });
});

const listSubtopicsByTopicController = asyncHandler(async (req, res) => {
  const result = await listSubtopicsByTopic({ topicId: req.params.topicId, query: req.query });

  return sendPaginatedResponse(
    res,
    {
      message: 'Subtopics fetched successfully',
      items: result.items,
      pagination: result.pagination,
    },
    200
  );
});

const createSubtopicController = asyncHandler(async (req, res) => {
  const subtopic = await createSubtopic({ topicId: req.params.topicId, data: req.body, userId: req.user._id || req.user.id });

  return sendResponse(res, {
    success: true,
    message: 'Subtopic created successfully',
    data: { subtopic },
    errors: [],
  }, 201);
});

const updateSubtopicController = asyncHandler(async (req, res) => {
  const subtopic = await updateSubtopic({ subtopicId: req.params.subtopicId, data: req.body, userId: req.user._id || req.user.id });

  return sendResponse(res, {
    success: true,
    message: 'Subtopic updated successfully',
    data: { subtopic },
    errors: [],
  });
});

const deleteSubtopicController = asyncHandler(async (req, res) => {
  await deleteSubtopic(req.params.subtopicId);

  return sendResponse(res, {
    success: true,
    message: 'Subtopic deleted successfully',
    data: null,
    errors: [],
  });
});

const bookmarkTopicController = asyncHandler(async (req, res) => {
  const progress = await bookmarkTopic({ userId: req.user._id || req.user.id, topicId: req.params.topicId, bookmarked: true });

  return sendResponse(res, {
    success: true,
    message: 'Topic bookmarked successfully',
    data: { progress },
    errors: [],
  });
});

const unbookmarkTopicController = asyncHandler(async (req, res) => {
  const progress = await bookmarkTopic({ userId: req.user._id || req.user.id, topicId: req.params.topicId, bookmarked: false });

  return sendResponse(res, {
    success: true,
    message: 'Topic bookmark removed successfully',
    data: { progress },
    errors: [],
  });
});

const completeTopicController = asyncHandler(async (req, res) => {
  const progress = await completeTopic({ userId: req.user._id || req.user.id, topicId: req.params.topicId, completed: true });

  return sendResponse(res, {
    success: true,
    message: 'Topic marked as completed successfully',
    data: { progress },
    errors: [],
  });
});

const uncompleteTopicController = asyncHandler(async (req, res) => {
  const progress = await completeTopic({ userId: req.user._id || req.user.id, topicId: req.params.topicId, completed: false });

  return sendResponse(res, {
    success: true,
    message: 'Topic completion removed successfully',
    data: { progress },
    errors: [],
  });
});

const getMyProgressController = asyncHandler(async (req, res) => {
  const result = await listMyProgress({ userId: req.user._id || req.user.id, query: req.query });

  return sendResponse(res, {
    success: true,
    message: 'Learning progress fetched successfully',
    data: result,
    errors: [],
  });
});

const getMyBookmarksController = asyncHandler(async (req, res) => {
  const result = await listBookmarkedTopics({ userId: req.user._id || req.user.id, query: req.query });

  return sendResponse(res, {
    success: true,
    message: 'Bookmarked topics fetched successfully',
    data: result,
    errors: [],
  });
});

const getMyCompletedTopicsController = asyncHandler(async (req, res) => {
  const result = await listCompletedTopics({ userId: req.user._id || req.user.id, query: req.query });

  return sendResponse(res, {
    success: true,
    message: 'Completed topics fetched successfully',
    data: result,
    errors: [],
  });
});

const recommendSubjectController = asyncHandler(async (req, res) => {
  const recommendation = await recommend({
    targetType: RECOMMENDATION_TARGET_TYPES.SUBJECT,
    targetId: req.params.subjectId,
    userId: req.user._id || req.user.id,
    note: req.body.note || '',
  });

  return sendResponse(res, {
    success: true,
    message: 'Subject recommended successfully',
    data: { recommendation },
    errors: [],
  }, 201);
});

const recommendTopicController = asyncHandler(async (req, res) => {
  const recommendation = await recommend({
    targetType: RECOMMENDATION_TARGET_TYPES.TOPIC,
    targetId: req.params.topicId,
    userId: req.user._id || req.user.id,
    note: req.body.note || '',
  });

  return sendResponse(res, {
    success: true,
    message: 'Topic recommended successfully',
    data: { recommendation },
    errors: [],
  }, 201);
});

module.exports = {
  listSubjectsController,
  createSubjectController,
  getSubjectController,
  updateSubjectController,
  deleteSubjectController,
  listTopicsBySubjectController,
  createTopicController,
  getTopicController,
  updateTopicController,
  deleteTopicController,
  listSubtopicsByTopicController,
  createSubtopicController,
  updateSubtopicController,
  deleteSubtopicController,
  bookmarkTopicController,
  unbookmarkTopicController,
  completeTopicController,
  uncompleteTopicController,
  getMyProgressController,
  getMyBookmarksController,
  getMyCompletedTopicsController,
  recommendSubjectController,
  recommendTopicController,
};
