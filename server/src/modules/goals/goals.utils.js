const goalsRepository = require('./goals.repository');

const toGoalView = (goal) => {
  const plainGoal = typeof goal.toObject === 'function' ? goal.toObject() : { ...goal };

  return plainGoal;
};

const uniqueObjectIdStrings = (values = []) => Array.from(new Set(values.map((value) => String(value))));

const normalizeSubjectIds = (values = []) => uniqueObjectIdStrings(values);

const normalizeBreakDays = (values = []) => Array.from(new Set(values.map((value) => String(value).trim()).filter(Boolean)));

const normalizeVacationDays = (values = []) =>
  values.map((item) => ({
    startDate: item.startDate,
    endDate: item.endDate,
    note: item.note || '',
  }));

const buildGoalFilters = (query = {}) => ({
  goalType: query.goalType,
  currentLevel: query.currentLevel,
  status: query.status,
});

const isFutureDate = (value) => {
  if (!value) {
    return false;
  }

  const targetDate = new Date(value);

  if (Number.isNaN(targetDate.getTime())) {
    return false;
  }

  return targetDate.getTime() > Date.now();
};

const goalHasActiveConflict = async ({ studentId, goalType, excludeGoalId = null }) => {
  const query = {
    studentId,
    goalType,
    status: 'active',
  };

  if (excludeGoalId) {
    query._id = { $ne: excludeGoalId };
  }

  return goalsRepository.existsActiveConflict({ studentId, goalType, excludeGoalId });
};

module.exports = {
  toGoalView,
  normalizeSubjectIds,
  normalizeBreakDays,
  normalizeVacationDays,
  buildGoalFilters,
  isFutureDate,
  goalHasActiveConflict,
};
