const express = require('express');
const {
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
} = require('./subjects.controller');
const { protect, authorizeRoles } = require('../../modules/auth/auth.middleware');
const validateRequest = require('../../middlewares/validateRequest.middleware');
const {
  listQueryValidators,
  subjectCreateValidators,
  subjectUpdateValidators,
  topicCreateValidators,
  topicUpdateValidators,
  subtopicCreateValidators,
  subtopicUpdateValidators,
  recommendationBodyValidators,
  subjectIdParamValidator,
  topicIdParamValidator,
  subtopicIdParamValidator,
  progressQueryValidators,
} = require('./subjects.validators');

const router = express.Router();

const authenticatedViewer = [protect, authorizeRoles('Student', 'Mentor', 'Admin')];
const adminOnly = [protect, authorizeRoles('Admin')];
const studentOnly = [protect, authorizeRoles('Student', 'Admin')];
const mentorOrAdmin = [protect, authorizeRoles('Mentor', 'Admin')];

router.get('/me/progress', ...studentOnly, progressQueryValidators, validateRequest, getMyProgressController);
router.get('/me/bookmarks', ...studentOnly, progressQueryValidators, validateRequest, getMyBookmarksController);
router.get('/me/completed', ...studentOnly, progressQueryValidators, validateRequest, getMyCompletedTopicsController);

router.get('/', ...authenticatedViewer, listQueryValidators, validateRequest, listSubjectsController);
router.post('/', ...adminOnly, subjectCreateValidators, validateRequest, createSubjectController);
router.get('/:subjectId', ...authenticatedViewer, subjectIdParamValidator, validateRequest, getSubjectController);
router.patch('/:subjectId', ...adminOnly, subjectIdParamValidator, subjectUpdateValidators, validateRequest, updateSubjectController);
router.delete('/:subjectId', ...adminOnly, subjectIdParamValidator, validateRequest, deleteSubjectController);
router.get('/:subjectId/topics', ...authenticatedViewer, subjectIdParamValidator, listQueryValidators, validateRequest, listTopicsBySubjectController);
router.post('/:subjectId/topics', ...adminOnly, subjectIdParamValidator, topicCreateValidators, validateRequest, createTopicController);
router.post('/:subjectId/recommend', ...mentorOrAdmin, subjectIdParamValidator, recommendationBodyValidators, validateRequest, recommendSubjectController);

router.get('/topics/:topicId', ...authenticatedViewer, topicIdParamValidator, validateRequest, getTopicController);
router.patch('/topics/:topicId', ...adminOnly, topicIdParamValidator, topicUpdateValidators, validateRequest, updateTopicController);
router.delete('/topics/:topicId', ...adminOnly, topicIdParamValidator, validateRequest, deleteTopicController);
router.get('/topics/:topicId/subtopics', ...authenticatedViewer, topicIdParamValidator, listQueryValidators, validateRequest, listSubtopicsByTopicController);
router.post('/topics/:topicId/subtopics', ...adminOnly, topicIdParamValidator, subtopicCreateValidators, validateRequest, createSubtopicController);
router.patch('/subtopics/:subtopicId', ...adminOnly, subtopicIdParamValidator, subtopicUpdateValidators, validateRequest, updateSubtopicController);
router.delete('/subtopics/:subtopicId', ...adminOnly, subtopicIdParamValidator, validateRequest, deleteSubtopicController);
router.post('/topics/:topicId/bookmark', ...studentOnly, topicIdParamValidator, validateRequest, bookmarkTopicController);
router.delete('/topics/:topicId/bookmark', ...studentOnly, topicIdParamValidator, validateRequest, unbookmarkTopicController);
router.post('/topics/:topicId/complete', ...studentOnly, topicIdParamValidator, validateRequest, completeTopicController);
router.delete('/topics/:topicId/complete', ...studentOnly, topicIdParamValidator, validateRequest, uncompleteTopicController);
router.post('/topics/:topicId/recommend', ...mentorOrAdmin, topicIdParamValidator, recommendationBodyValidators, validateRequest, recommendTopicController);

module.exports = router;
