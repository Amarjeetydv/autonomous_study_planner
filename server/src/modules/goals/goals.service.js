const AppError = require('../../utils/AppError');
const { buildListQuery, buildPagination } = require('../../services/query.service');
const goalsRepository = require('./goals.repository');
const Subject = require('../../models/Subject');
const { toGoalView, normalizeSubjectIds, normalizeBreakDays, normalizeVacationDays, buildGoalFilters, isFutureDate, goalHasActiveConflict } = require('./goals.utils');
const { GOAL_STATUS } = require('./goals.constants');

const resolveUserScope = (user) => {
  const roles = user?.roles || [];

  return {
    isStudent: roles.includes('Student'),
    isMentor: roles.includes('Mentor'),
    isAdmin: roles.includes('Admin'),
  };
};

const ensureGoalOwnershipOrAdmin = (goal, user) => {
  const scope = resolveUserScope(user);

  if (scope.isAdmin) {
    return;
  }

  if (scope.isMentor) {
    return;
  }

  if (!scope.isStudent) {
    throw new AppError('You do not have permission to access this goal', 403);
  }

  if (String(goal.studentId) !== String(user._id || user.id)) {
    throw new AppError('You do not have permission to access this goal', 403);
  }
};

const validateSubjectsExist = async (subjectIds = []) => {
  if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
    return [];
  }

  const uniqueIds = normalizeSubjectIds(subjectIds);
  const subjects = await Subject.find({ _id: { $in: uniqueIds } }).select('_id').lean();

  if (subjects.length !== uniqueIds.length) {
    throw new AppError('One or more selected subjects are invalid', 400);
  }

  return uniqueIds;
};

const assertSubjectSubset = (subset = [], selected = []) => {
  const selectedSet = new Set(selected.map(String));

  const invalidIds = subset.map(String).filter((subjectId) => !selectedSet.has(subjectId));

  if (invalidIds.length > 0) {
    throw new AppError('Strong, weak, and priority subjects must be selected subjects', 400);
  }
};

const buildGoalData = async ({ data, userId, status = GOAL_STATUS.ACTIVE }) => {
  const selectedSubjects = await validateSubjectsExist(data.selectedSubjects || []);
  const strongSubjects = await validateSubjectsExist(data.strongSubjects || []);
  const weakSubjects = await validateSubjectsExist(data.weakSubjects || []);
  const prioritySubjects = await validateSubjectsExist(data.prioritySubjects || []);

  assertSubjectSubset(strongSubjects, selectedSubjects);
  assertSubjectSubset(weakSubjects, selectedSubjects);
  assertSubjectSubset(prioritySubjects, selectedSubjects);

  if (!isFutureDate(data.targetDate)) {
    throw new AppError('Target date must be a future date', 400);
  }

  return {
    studentId: userId,
    title: data.title,
    goalType: String(data.goalType).toUpperCase(),
    targetDate: data.targetDate,
    currentLevel: data.currentLevel,
    dailyStudyHours: data.dailyStudyHours,
    weeklyStudyDays: data.weeklyStudyDays,
    preferredStudyTime: data.preferredStudyTime,
    preferredSessionLengthMinutes: data.preferredSessionLengthMinutes,
    strongSubjects,
    weakSubjects,
    selectedSubjects,
    prioritySubjects,
    difficultyPreference: data.difficultyPreference,
    learningStyle: data.learningStyle,
    targetScore: data.targetScore ?? null,
    motivation: data.motivation || '',
    breakDays: normalizeBreakDays(data.breakDays || []),
    vacationDays: normalizeVacationDays(data.vacationDays || []),
    timezone: data.timezone,
    language: data.language,
    reminderPreference: {
      isEnabled: data.reminderPreference?.isEnabled ?? true,
      mode: data.reminderPreference?.mode || 'In-App',
      reminderTime: data.reminderPreference?.reminderTime || '08:00',
      frequency: data.reminderPreference?.frequency || 'Daily',
    },
    calendarPreference: {
      isEnabled: data.calendarPreference?.isEnabled ?? true,
      includeWeekends: data.calendarPreference?.includeWeekends ?? false,
      includeBreakDays: data.calendarPreference?.includeBreakDays ?? true,
      color: data.calendarPreference?.color || '#4f46e5',
    },
    status,
  };
};

const listGoals = async ({ user, query = {} }) => {
  const scope = resolveUserScope(user);
  const studentIdFilter = scope.isAdmin || scope.isMentor ? query.studentId : user._id || user.id;

  const { query: mongoQuery, sortQuery, pagination } = buildListQuery({
    keyword: query.keyword || query.search,
    searchFields: ['title', 'goalType', 'motivation', 'language', 'timezone'],
    filters: {
      ...buildGoalFilters(query),
      ...(studentIdFilter ? { studentId: studentIdFilter } : {}),
    },
    dateField: 'targetDate',
    sortBy: query.sortBy || 'targetDate',
    sortOrder: query.sortOrder || 'asc',
    page: query.page,
    limit: query.limit,
  });

  if (query.from || query.to) {
    mongoQuery.targetDate = {};

    if (query.from) {
      mongoQuery.targetDate.$gte = new Date(query.from);
    }

    if (query.to) {
      mongoQuery.targetDate.$lte = new Date(query.to);
    }
  }

  const [totalItems, goals] = await Promise.all([
    goalsRepository.count(mongoQuery),
    goalsRepository.find({ query: mongoQuery, sort: sortQuery, skip: pagination.skip, limit: pagination.limit, lean: true }),
  ]);

  return {
    items: goals.map(toGoalView),
    pagination: buildPagination({ page: pagination.page, limit: pagination.limit, totalItems }),
  };
};

const createGoal = async ({ user, data }) => {
  const userId = user._id || user.id;
  const goalType = String(data.goalType).toUpperCase();

  if (await goalHasActiveConflict({ studentId: userId, goalType })) {
    throw new AppError('You already have an active goal in this category', 409);
  }

  const goal = await goalsRepository.create(await buildGoalData({ data: { ...data, goalType }, userId }));

  return toGoalView(goal);
};

const getGoalById = async ({ goalId, user }) => {
  const goal = await goalsRepository.findById(goalId, true);

  if (!goal) {
    throw new AppError('Goal not found', 404);
  }

  ensureGoalOwnershipOrAdmin(goal, user);

  return toGoalView(goal);
};

const updateGoal = async ({ goalId, user, data }) => {
  const goal = await goalsRepository.findById(goalId, false);

  if (!goal) {
    throw new AppError('Goal not found', 404);
  }

  ensureGoalOwnershipOrAdmin(goal, user);

  if ([GOAL_STATUS.COMPLETED, GOAL_STATUS.ARCHIVED].includes(goal.status)) {
    throw new AppError('Completed and archived goals are read-only', 403);
  }

  if (data.status) {
    throw new AppError('Use dedicated goal action endpoints to change status', 400);
  }

  if (data.targetDate && !isFutureDate(data.targetDate)) {
    throw new AppError('Target date must be a future date', 400);
  }

  if (data.goalType) {
    const nextGoalType = String(data.goalType).toUpperCase();

    if (nextGoalType !== goal.goalType && (await goalHasActiveConflict({ studentId: goal.studentId, goalType: nextGoalType, excludeGoalId: goal._id }))) {
      throw new AppError('You already have an active goal in this category', 409);
    }

    goal.goalType = nextGoalType;
  }

  const updateData = {
    ...data,
    status: goal.status,
  };

  if (data.selectedSubjects || data.strongSubjects || data.weakSubjects || data.prioritySubjects) {
    const selectedSubjects = data.selectedSubjects ? await validateSubjectsExist(data.selectedSubjects) : goal.selectedSubjects.map(String);
    const strongSubjects = data.strongSubjects ? await validateSubjectsExist(data.strongSubjects) : goal.strongSubjects.map(String);
    const weakSubjects = data.weakSubjects ? await validateSubjectsExist(data.weakSubjects) : goal.weakSubjects.map(String);
    const prioritySubjects = data.prioritySubjects ? await validateSubjectsExist(data.prioritySubjects) : goal.prioritySubjects.map(String);

    assertSubjectSubset(strongSubjects, selectedSubjects);
    assertSubjectSubset(weakSubjects, selectedSubjects);
    assertSubjectSubset(prioritySubjects, selectedSubjects);

    updateData.selectedSubjects = selectedSubjects;
    updateData.strongSubjects = strongSubjects;
    updateData.weakSubjects = weakSubjects;
    updateData.prioritySubjects = prioritySubjects;
  }

  if (data.breakDays) {
    updateData.breakDays = normalizeBreakDays(data.breakDays);
  }

  if (data.vacationDays) {
    updateData.vacationDays = normalizeVacationDays(data.vacationDays);
  }

  if (data.reminderPreference) {
    updateData.reminderPreference = {
      ...goal.reminderPreference.toObject?.() || goal.reminderPreference,
      ...data.reminderPreference,
    };
  }

  if (data.calendarPreference) {
    updateData.calendarPreference = {
      ...goal.calendarPreference.toObject?.() || goal.calendarPreference,
      ...data.calendarPreference,
    };
  }

  Object.assign(goal, updateData);
  await goal.save();

  return toGoalView(goal);
};

const deleteGoal = async ({ goalId, user }) => {
  const goal = await goalsRepository.findById(goalId, false);

  if (!goal) {
    throw new AppError('Goal not found', 404);
  }

  ensureGoalOwnershipOrAdmin(goal, user);

  if ([GOAL_STATUS.COMPLETED, GOAL_STATUS.ARCHIVED].includes(goal.status)) {
    throw new AppError('Completed and archived goals are read-only', 403);
  }

  await goal.deleteOne();

  return { deleted: true };
};

const pauseGoal = async ({ goalId, user }) => {
  const goal = await goalsRepository.findById(goalId, false);

  if (!goal) {
    throw new AppError('Goal not found', 404);
  }

  ensureGoalOwnershipOrAdmin(goal, user);

  if ([GOAL_STATUS.COMPLETED, GOAL_STATUS.ARCHIVED].includes(goal.status)) {
    throw new AppError('Completed and archived goals are read-only', 403);
  }

  if (goal.status === GOAL_STATUS.PAUSED) {
    return toGoalView(goal);
  }

  goal.status = GOAL_STATUS.PAUSED;
  goal.pausedAt = new Date();
  goal.reminderPreference.isEnabled = false;

  await goal.save();
  return toGoalView(goal);
};

const resumeGoal = async ({ goalId, user }) => {
  const goal = await goalsRepository.findById(goalId, false);

  if (!goal) {
    throw new AppError('Goal not found', 404);
  }

  ensureGoalOwnershipOrAdmin(goal, user);

  if (goal.status === GOAL_STATUS.ARCHIVED) {
    throw new AppError('Archived goals are read-only', 403);
  }

  if (goal.status === GOAL_STATUS.COMPLETED) {
    throw new AppError('Completed goals are immutable', 403);
  }

  if (await goalHasActiveConflict({ studentId: goal.studentId, goalType: goal.goalType, excludeGoalId: goal._id })) {
    throw new AppError('You already have an active goal in this category', 409);
  }

  goal.status = GOAL_STATUS.ACTIVE;
  goal.pausedAt = null;
  goal.reminderPreference.isEnabled = true;

  await goal.save();
  return toGoalView(goal);
};

const archiveGoal = async ({ goalId, user }) => {
  const goal = await goalsRepository.findById(goalId, false);

  if (!goal) {
    throw new AppError('Goal not found', 404);
  }

  ensureGoalOwnershipOrAdmin(goal, user);

  if (goal.status === GOAL_STATUS.COMPLETED) {
    throw new AppError('Completed goals are immutable', 403);
  }

  goal.status = GOAL_STATUS.ARCHIVED;
  goal.archivedAt = new Date();
  goal.reminderPreference.isEnabled = false;

  await goal.save();
  return toGoalView(goal);
};

const completeGoal = async ({ goalId, user }) => {
  const goal = await goalsRepository.findById(goalId, false);

  if (!goal) {
    throw new AppError('Goal not found', 404);
  }

  ensureGoalOwnershipOrAdmin(goal, user);

  if ([GOAL_STATUS.COMPLETED, GOAL_STATUS.ARCHIVED].includes(goal.status)) {
    throw new AppError('Completed and archived goals are read-only', 403);
  }

  goal.status = GOAL_STATUS.COMPLETED;
  goal.completedAt = new Date();
  goal.reminderPreference.isEnabled = false;

  await goal.save();
  return toGoalView(goal);
};

const duplicateGoal = async ({ goalId, user, title }) => {
  const goal = await goalsRepository.findById(goalId, true);

  if (!goal) {
    throw new AppError('Goal not found', 404);
  }

  ensureGoalOwnershipOrAdmin(goal, user);

  const duplicateTitle = title || `${goal.title} (Copy)`;
  const duplicateData = {
    ...goal,
    _id: undefined,
    title: duplicateTitle,
    status: GOAL_STATUS.PAUSED,
    pausedAt: new Date(),
    archivedAt: null,
    completedAt: null,
    reminderPreference: {
      ...(goal.reminderPreference || {}),
      isEnabled: false,
    },
  };

  const duplicate = await goalsRepository.create(duplicateData);

  return toGoalView(duplicate);
};

module.exports = {
  listGoals,
  createGoal,
  getGoalById,
  updateGoal,
  deleteGoal,
  pauseGoal,
  resumeGoal,
  archiveGoal,
  completeGoal,
  duplicateGoal,
  validateSubjectsExist,
};
