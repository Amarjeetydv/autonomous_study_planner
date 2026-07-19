const adminRepository = require('./admin.repository');
const Subject = require('../../models/Subject');
const Topic = require('../../models/Topic');
const Subtopic = require('../../models/Subtopic');
const AppError = require('../../utils/errors/AppError');
const mongoose = require('mongoose');

const getDashboardStats = async () => {
  return adminRepository.getSystemStats();
};

const listUsers = async (query = {}) => {
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.status) filter.status = query.status;
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } }
    ];
  }
  return adminRepository.findUsers(filter);
};

const updateUserStatus = async ({ adminId, targetUserId, data, ipAddress }) => {
  const previous = await adminRepository.findUserById(targetUserId);
  if (!previous) {
    throw new AppError('Target user not found', 404);
  }

  const updated = await adminRepository.updateUser(targetUserId, data);

  // Log audit trace
  await adminRepository.logAudit({
    adminId,
    action: 'USER_UPDATE',
    entity: 'User',
    entityId: targetUserId,
    previousValue: { role: previous.role, status: previous.status },
    newValue: { role: updated.role, status: updated.status },
    ipAddress,
  });

  return updated;
};

const deleteUserAccount = async ({ adminId, targetUserId, ipAddress }) => {
  const target = await adminRepository.findUserById(targetUserId);
  if (!target) {
    throw new AppError('Target user not found', 404);
  }

  await adminRepository.deleteUser(targetUserId);

  await adminRepository.logAudit({
    adminId,
    action: 'USER_DELETE',
    entity: 'User',
    entityId: targetUserId,
    previousValue: { name: target.name, email: target.email },
    newValue: null,
    ipAddress,
  });

  return { deleted: true };
};

const listCurriculum = async () => {
  const subjects = await Subject.find().lean();
  const topics = await Topic.find().lean();
  const subtopics = await Subtopic.find().lean();

  return { subjects, topics, subtopics };
};

const createSubject = async ({ adminId, data, ipAddress }) => {
  const subject = await Subject.create(data);
  await adminRepository.logAudit({
    adminId,
    action: 'SUBJECT_CREATE',
    entity: 'Subject',
    entityId: subject._id,
    previousValue: null,
    newValue: subject,
    ipAddress
  });
  return subject;
};

const updateSubject = async ({ adminId, subjectId, data, ipAddress }) => {
  const previous = await Subject.findById(subjectId);
  const updated = await Subject.findByIdAndUpdate(subjectId, { $set: data }, { new: true });
  await adminRepository.logAudit({
    adminId,
    action: 'SUBJECT_UPDATE',
    entity: 'Subject',
    entityId: subjectId,
    previousValue: previous,
    newValue: updated,
    ipAddress
  });
  return updated;
};

const deleteSubject = async ({ adminId, subjectId, ipAddress }) => {
  const previous = await Subject.findById(subjectId);
  await Subject.findByIdAndDelete(subjectId);
  await adminRepository.logAudit({
    adminId,
    action: 'SUBJECT_DELETE',
    entity: 'Subject',
    entityId: subjectId,
    previousValue: previous,
    newValue: null,
    ipAddress
  });
  return { deleted: true };
};

const getAuditLogs = async () => {
  return adminRepository.findAuditLogs();
};

const getSystemHealth = async () => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Healthy' : 'Disconnected';
  return {
    database: dbStatus,
    server: 'Healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
  };
};

module.exports = {
  getDashboardStats,
  listUsers,
  updateUserStatus,
  deleteUserAccount,
  listCurriculum,
  createSubject,
  updateSubject,
  deleteSubject,
  getAuditLogs,
  getSystemHealth,
};
