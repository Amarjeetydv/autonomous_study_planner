const MentorStudent = require('../../models/MentorStudent');
const MentorFeedback = require('../../models/MentorFeedback');

const createRequest = async (data) => {
  return MentorStudent.create(data);
};

const updateStatus = async (mentorId, studentId, status) => {
  const update = { status };
  if (status === 'accepted') {
    update.acceptedAt = new Date();
  }
  return MentorStudent.findOneAndUpdate({ mentorId, studentId }, { $set: update }, { new: true });
};

const findStudentsForMentor = async (mentorId) => {
  return MentorStudent.find({ mentorId, status: 'accepted' })
    .populate('studentId', 'name email avatar')
    .lean();
};

const findLink = async (mentorId, studentId) => {
  return MentorStudent.findOne({ mentorId, studentId });
};

const createFeedback = async (data) => {
  return MentorFeedback.create(data);
};

const findFeedbackForStudent = async (studentId) => {
  return MentorFeedback.find({ studentId })
    .populate('mentorId', 'name email avatar')
    .sort({ createdAt: -1 })
    .lean();
};

module.exports = {
  createRequest,
  updateStatus,
  findStudentsForMentor,
  findLink,
  createFeedback,
  findFeedbackForStudent,
};
