const Goal = require('../../models/Goal');

const existsActiveConflict = async ({ studentId, goalType, excludeGoalId = null }) => {
  const query = {
    studentId,
    goalType,
    status: 'active',
  };

  if (excludeGoalId) {
    query._id = { $ne: excludeGoalId };
  }

  return Goal.exists(query);
};

const create = async (goalData) => {
  return Goal.create(goalData);
};

const findById = async (id, lean = false) => {
  const query = Goal.findById(id);
  return lean ? query.lean() : query;
};

const find = async ({ query = {}, sort = {}, skip = 0, limit = 10, lean = true } = {}) => {
  const q = Goal.find(query).sort(sort).skip(skip).limit(limit);
  return lean ? q.lean() : q;
};

const count = async (query = {}) => {
  return Goal.countDocuments(query);
};

const findByIdAndUpdate = async (id, updateData, options = { new: true }) => {
  return Goal.findByIdAndUpdate(id, updateData, options);
};

const deleteById = async (id) => {
  return Goal.findByIdAndDelete(id);
};

module.exports = {
  existsActiveConflict,
  create,
  findById,
  find,
  count,
  findByIdAndUpdate,
  deleteById,
};
