const MentorStudent = require('../../models/MentorStudent');
const MentorFeedback = require('../../models/MentorFeedback');
const Mentor = require('../../models/Mentor');
const User = require('../../models/User');

const findAvailableMentors = async () => {
  // Find all mentors in Mentors collection and populate user name/email
  const mentorsList = await Mentor.find({})
    .populate('userId', 'name email avatarUrl')
    .lean();
  return mentorsList;
};

const findConnectedMentorForStudent = async (studentId) => {
  const link = await MentorStudent.findOne({ studentId, status: 'accepted' })
    .populate('mentorId', 'name email avatarUrl phone')
    .lean();
  
  if (link && link.mentorId) {
    const profile = await Mentor.findOne({ userId: link.mentorId._id }).lean();
    return {
      ...link,
      mentorProfile: profile || null
    };
  }
  return null;
};

const findPendingLinkForStudent = async (studentId) => {
  return MentorStudent.findOne({ studentId, status: 'pending' })
    .populate('mentorId', 'name email avatarUrl')
    .lean();
};

const createRequest = async (data) => {
  return MentorStudent.create(data);
};

const updateStatus = async (mentorId, studentId, status) => {
  const update = { status };
  if (status === 'accepted') {
    update.acceptedAt = new Date();
  }

  let userObjectId = mentorId;
  const mentorDoc = await Mentor.findById(mentorId).lean();
  if (mentorDoc) {
    userObjectId = mentorDoc.userId;
  }

  return MentorStudent.findOneAndUpdate(
    {
      $or: [{ mentorId: userObjectId }, { mentorId: mentorId }],
      studentId
    },
    { $set: update },
    { new: true }
  );
};

const findStudentsForMentor = async (mentorId) => {
  let userObjectId = mentorId;
  const mentorDoc = await Mentor.findById(mentorId).lean();
  if (mentorDoc) {
    userObjectId = mentorDoc.userId;
  }

  return MentorStudent.find({
    $or: [{ mentorId: userObjectId }, { mentorId: mentorId }],
    status: 'accepted'
  })
    .populate('studentId', 'name email avatarUrl')
    .lean();
};

const findPendingRequestsForMentor = async (mentorId) => {
  let userObjectId = mentorId;
  const mentorDoc = await Mentor.findById(mentorId).lean();
  if (mentorDoc) {
    userObjectId = mentorDoc.userId;
  }

  return MentorStudent.find({
    $or: [{ mentorId: userObjectId }, { mentorId: mentorId }],
    status: 'pending'
  })
    .populate('studentId', 'name email avatarUrl')
    .lean();
};

const findLink = async (mentorId, studentId) => {
  let userObjectId = mentorId;
  const mentorDoc = await Mentor.findById(mentorId).lean();
  if (mentorDoc) {
    userObjectId = mentorDoc.userId;
  }

  return MentorStudent.findOne({
    $or: [{ mentorId: userObjectId }, { mentorId: mentorId }],
    studentId
  });
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
  findPendingRequestsForMentor,
  findLink,
  createFeedback,
  findFeedbackForStudent,
  findAvailableMentors,
  findConnectedMentorForStudent,
  findPendingLinkForStudent,
};
