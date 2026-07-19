const RescheduleLog = require('../../models/RescheduleLog');

const createLog = async (data) => {
  return RescheduleLog.create(data);
};

const findActivePreview = async (studentId) => {
  return RescheduleLog.findOne({ studentId, status: 'preview' }).sort({ createdAt: -1 });
};

const findHistory = async (studentId) => {
  return RescheduleLog.find({ studentId, status: { $ne: 'preview' } }).sort({ updatedAt: -1 }).lean();
};

const findById = async (id) => {
  return RescheduleLog.findById(id);
};

const updateLogStatus = async (id, status, appliedAt = null) => {
  return RescheduleLog.findByIdAndUpdate(id, { status, appliedAt }, { new: true });
};

module.exports = {
  createLog,
  findActivePreview,
  findHistory,
  findById,
  updateLogStatus,
};
