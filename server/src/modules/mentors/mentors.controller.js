const asyncHandler = require('../../middlewares/asyncHandler');
const { sendResponse } = require('../../utils/response');
const mentorsService = require('./mentors.service');

const requestMentorLinkController = asyncHandler(async (req, res) => {
  const studentId = req.user._id || req.user.id;
  const { mentorId } = req.body;

  const request = await mentorsService.requestMentorLink({ studentId, mentorId });

  return sendResponse(res, {
    success: true,
    message: 'Mentor link request dispatched successfully',
    data: { request },
    errors: [],
  }, 201);
});

const acceptStudentRequestController = asyncHandler(async (req, res) => {
  const mentorId = req.user._id || req.user.id;
  const { studentId } = req.body;

  const link = await mentorsService.acceptStudentRequest({ mentorId, studentId });

  return sendResponse(res, {
    success: true,
    message: 'Student request accepted successfully',
    data: { link },
    errors: [],
  });
});

const rejectStudentRequestController = asyncHandler(async (req, res) => {
  const mentorId = req.user._id || req.user.id;
  const { studentId } = req.body;

  const link = await mentorsService.rejectStudentRequest({ mentorId, studentId });

  return sendResponse(res, {
    success: true,
    message: 'Student request rejected successfully',
    data: { link },
    errors: [],
  });
});

const getAssignedStudentsController = asyncHandler(async (req, res) => {
  const mentorId = req.user._id || req.user.id;
  const students = await mentorsService.getAssignedStudents(mentorId);

  return sendResponse(res, {
    success: true,
    message: 'Assigned students list retrieved successfully',
    data: { students },
    errors: [],
  });
});

const getStudentDetailController = asyncHandler(async (req, res) => {
  const mentorId = req.user._id || req.user.id;
  const studentId = req.params.studentId;

  const detail = await mentorsService.getStudentDetail({ mentorId, studentId });

  return sendResponse(res, {
    success: true,
    message: 'Student profile parameters compiled successfully',
    data: { detail },
    errors: [],
  });
});

const leaveFeedbackController = asyncHandler(async (req, res) => {
  const mentorId = req.user._id || req.user.id;
  const feedback = await mentorsService.leaveFeedback({ mentorId, data: req.body });

  return sendResponse(res, {
    success: true,
    message: 'Mentor progress feedback created successfully',
    data: { feedback },
    errors: [],
  }, 201);
});

const getFeedbackListController = asyncHandler(async (req, res) => {
  const studentId = req.params.studentId;
  const feedback = await mentorsService.getFeedbackList(studentId);

  return sendResponse(res, {
    success: true,
    message: 'Mentor feedback records retrieved successfully',
    data: { feedback },
    errors: [],
  });
});

module.exports = {
  requestMentorLinkController,
  acceptStudentRequestController,
  rejectStudentRequestController,
  getAssignedStudentsController,
  getStudentDetailController,
  leaveFeedbackController,
  getFeedbackListController,
};
