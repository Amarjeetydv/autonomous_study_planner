const Calendar = require('../../models/CalendarEvent');

const createEvent = async (data) => {
  return Calendar.create(data);
};

const findEvents = async (query = {}, sort = { startDateTime: 1 }) => {
  return Calendar.find(query)
    .sort(sort)
    .lean();
};

const findEventById = async (id) => {
  return Calendar.findById(id);
};

const updateEvent = async (id, updateData) => {
  return Calendar.findByIdAndUpdate(id, { $set: updateData }, { new: true });
};

const deleteEvent = async (id) => {
  return Calendar.findByIdAndDelete(id);
};

module.exports = {
  createEvent,
  findEvents,
  findEventById,
  updateEvent,
  deleteEvent,
};
