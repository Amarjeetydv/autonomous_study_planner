const DailyCheckIn = require('../../models/DailyCheckIn');
const Streak = require('../../models/Streak');

const create = async (data) => {
  return DailyCheckIn.create(data);
};

const find = async (query = {}, sort = { date: -1 }) => {
  return DailyCheckIn.find(query).sort(sort).lean();
};

const findOne = async (query) => {
  return DailyCheckIn.findOne(query);
};

const findStreak = async (studentId) => {
  return Streak.findOne({ studentId });
};

const upsertStreak = async (studentId, updateData) => {
  return Streak.findOneAndUpdate(
    { studentId },
    { $set: updateData },
    { new: true, upsert: true }
  );
};

module.exports = {
  create,
  find,
  findOne,
  findStreak,
  upsertStreak,
};
