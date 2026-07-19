const asyncHandler = require('../../middlewares/asyncHandler');
const { sendResponse } = require('../../utils/response');
const adminService = require('./admin.service');

const getDashboardStatsController = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  return sendResponse(res, {
    success: true,
    message: 'Admin metrics dashboard stats compiled successfully',
    data: stats,
    errors: []
  });
});

const listUsersController = asyncHandler(async (req, res) => {
  const users = await adminService.listUsers(req.query);
  return sendResponse(res, {
    success: true,
    message: 'Users lists compiled successfully',
    data: { users },
    errors: []
  });
});

const updateUserStatusController = asyncHandler(async (req, res) => {
  const adminId = req.user._id || req.user.id;
  const targetUserId = req.params.id;
  const ipAddress = req.ip || '';

  const user = await adminService.updateUserStatus({
    adminId,
    targetUserId,
    data: req.body,
    ipAddress
  });

  return sendResponse(res, {
    success: true,
    message: 'User profile metrics updated successfully by administrator',
    data: { user },
    errors: []
  });
});

const deleteUserAccountController = asyncHandler(async (req, res) => {
  const adminId = req.user._id || req.user.id;
  const targetUserId = req.params.id;
  const ipAddress = req.ip || '';

  await adminService.deleteUserAccount({
    adminId,
    targetUserId,
    ipAddress
  });

  return sendResponse(res, {
    success: true,
    message: 'User account removed from catalog by administrator',
    data: {},
    errors: []
  });
});

const listCurriculumController = asyncHandler(async (req, res) => {
  const curriculum = await adminService.listCurriculum();
  return sendResponse(res, {
    success: true,
    message: 'Subjects catalog elements compiled successfully',
    data: curriculum,
    errors: []
  });
});

const createSubjectController = asyncHandler(async (req, res) => {
  const adminId = req.user._id || req.user.id;
  const ipAddress = req.ip || '';

  const subject = await adminService.createSubject({
    adminId,
    data: req.body,
    ipAddress
  });

  return sendResponse(res, {
    success: true,
    message: 'Subject curriculum block logged successfully by administrator',
    data: { subject },
    errors: []
  }, 201);
});

const updateSubjectController = asyncHandler(async (req, res) => {
  const adminId = req.user._id || req.user.id;
  const subjectId = req.params.id;
  const ipAddress = req.ip || '';

  const subject = await adminService.updateSubject({
    adminId,
    subjectId,
    data: req.body,
    ipAddress
  });

  return sendResponse(res, {
    success: true,
    message: 'Subject curriculum parameters updated successfully',
    data: { subject },
    errors: []
  });
});

const deleteSubjectController = asyncHandler(async (req, res) => {
  const adminId = req.user._id || req.user.id;
  const subjectId = req.params.id;
  const ipAddress = req.ip || '';

  await adminService.deleteSubject({
    adminId,
    subjectId,
    ipAddress
  });

  return sendResponse(res, {
    success: true,
    message: 'Subject curriculum node deleted successfully',
    data: {},
    errors: []
  });
});

const getAuditLogsController = asyncHandler(async (req, res) => {
  const logs = await adminService.getAuditLogs();
  return sendResponse(res, {
    success: true,
    message: 'Admin audit logs retrieved successfully',
    data: { logs },
    errors: []
  });
});

const getSystemHealthController = asyncHandler(async (req, res) => {
  const health = await adminService.getSystemHealth();
  return sendResponse(res, {
    success: true,
    message: 'System database and queue health checked successfully',
    data: health,
    errors: []
  });
});

module.exports = {
  getDashboardStatsController,
  listUsersController,
  updateUserStatusController,
  deleteUserAccountController,
  listCurriculumController,
  createSubjectController,
  updateSubjectController,
  deleteSubjectController,
  getAuditLogsController,
  getSystemHealthController,
};
