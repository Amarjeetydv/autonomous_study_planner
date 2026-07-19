const DailyTask = require('../../models/DailyTask');

const create = async (taskData) => {
  return DailyTask.create(taskData);
};

const insertMany = async (tasksArray) => {
  return DailyTask.insertMany(tasksArray);
};

const findById = async (id) => {
  return DailyTask.findById(id);
};

const find = async (query = {}, sort = { scheduledDate: 1 }) => {
  return DailyTask.find(query).sort(sort).populate('subjectId', 'name code color').lean();
};

const findByIdAndUpdate = async (id, updateData, options = { new: true }) => {
  return DailyTask.findByIdAndUpdate(id, updateData, options);
};

const deleteById = async (id) => {
  return DailyTask.findByIdAndDelete(id);
};

module.exports = {
  create,
  insertMany,
  findById,
  find,
  findByIdAndUpdate,
  deleteById,
};
