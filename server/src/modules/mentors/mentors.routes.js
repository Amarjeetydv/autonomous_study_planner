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
  getAvailableMentorsController,
  getConnectedMentorController,
  inviteMentorController,
  requestReviewController,
  getPendingRequestsController,
} = require('./mentors.controller');
const {
  requestLinkValidators,
  responseLinkValidators,
  leaveFeedbackValidators,
  studentIdParamValidator,
} = require('./mentors.validators');

const router = express.Router();

const studentAccess = [protect, authorizeRoles('Student')];
const mentorAccess = [protect, authorizeRoles('Mentor', 'Admin')];
const generalAccess = [protect, authorizeRoles('Student', 'Mentor', 'Admin')];

router.post('/request', ...studentAccess, requestLinkValidators, validateRequest, requestMentorLinkController);
router.post('/accept', ...mentorAccess, responseLinkValidators, validateRequest, acceptStudentRequestController);
router.post('/reject', ...mentorAccess, responseLinkValidators, validateRequest, rejectStudentRequestController);
router.get('/students', ...mentorAccess, getAssignedStudentsController);
router.get('/student/:studentId', ...mentorAccess, studentIdParamValidator, validateRequest, getStudentDetailController);
router.post('/feedback', ...mentorAccess, leaveFeedbackController); // bypass standard validators to support saas feedback payload cleanly
router.get('/feedback/:studentId', ...generalAccess, studentIdParamValidator, validateRequest, getFeedbackListController);

// SaaS mentorship routes
router.get('/available', ...studentAccess, getAvailableMentorsController);
router.get('/my-mentor', ...studentAccess, getConnectedMentorController);
router.post('/invite', ...studentAccess, inviteMentorController);
router.post('/request-review', ...studentAccess, requestReviewController);
router.get('/requests', ...mentorAccess, getPendingRequestsController);
router.get('/invitations', ...mentorAccess, getPendingRequestsController);

module.exports = router;
