const express = require('express');
const { protect, authorizeRoles } = require('../auth/auth.middleware');
const validateRequest = require('../../middlewares/validateRequest.middleware');
const {
  requestMentorLinkController,
  acceptStudentRequestController,
  rejectStudentRequestController,
  getAssignedStudentsController,
  getStudentDetailController,
  leaveFeedbackController,
  getFeedbackListController,
} = require('./mentors.controller');
const {
  requestLinkValidators,
  responseLinkValidators,
  leaveFeedbackValidators,
  studentIdParamValidator,
} = require('./mentors.validators');

const router = express.Router();

const studentAccess = [protect, authorizeRoles('Student')];
const mentorAccess = [protect, authorizeRoles('Mentor')];
const generalAccess = [protect, authorizeRoles('Student', 'Mentor', 'Admin')];

router.post('/request', ...studentAccess, requestLinkValidators, validateRequest, requestMentorLinkController);
router.post('/accept', ...mentorAccess, responseLinkValidators, validateRequest, acceptStudentRequestController);
router.post('/reject', ...mentorAccess, responseLinkValidators, validateRequest, rejectStudentRequestController);
router.get('/students', ...mentorAccess, getAssignedStudentsController);
router.get('/student/:studentId', ...mentorAccess, studentIdParamValidator, validateRequest, getStudentDetailController);
router.post('/feedback', ...mentorAccess, leaveFeedbackValidators, validateRequest, leaveFeedbackController);
router.get('/feedback/:studentId', ...generalAccess, studentIdParamValidator, validateRequest, getFeedbackListController);

module.exports = router;
