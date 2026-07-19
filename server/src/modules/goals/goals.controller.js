const asyncHandler = require('../../middlewares/asyncHandler');
const { sendResponse, sendPaginatedResponse } = require('../../utils/response');
const {
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
} = require('./goals.service');

const listGoalsController = asyncHandler(async (req, res) => {
  const result = await listGoals({ user: req.user, query: req.query });

  return sendPaginatedResponse(
    res,
    {
      message: 'Goals fetched successfully',
      items: result.items,
      pagination: result.pagination,
    },
    200
  );
});

const createGoalController = asyncHandler(async (req, res) => {
  const goal = await createGoal({ user: req.user, data: req.body });

  return sendResponse(
    res,
    {
      success: true,
      message: 'Goal created successfully',
      data: { goal },
      errors: [],
    },
    201
  );
});

const getGoalController = asyncHandler(async (req, res) => {
  const goal = await getGoalById({ goalId: req.params.goalId, user: req.user });

  return sendResponse(res, {
    success: true,
    message: 'Goal fetched successfully',
    data: { goal },
    errors: [],
  });
});

const updateGoalController = asyncHandler(async (req, res) => {
  const goal = await updateGoal({ goalId: req.params.goalId, user: req.user, data: req.body });

  return sendResponse(res, {
    success: true,
    message: 'Goal updated successfully',
    data: { goal },
    errors: [],
  });
});

const deleteGoalController = asyncHandler(async (req, res) => {
  await deleteGoal({ goalId: req.params.goalId, user: req.user });

  return sendResponse(res, {
    success: true,
    message: 'Goal deleted successfully',
    data: null,
    errors: [],
  });
});

const pauseGoalController = asyncHandler(async (req, res) => {
  const goal = await pauseGoal({ goalId: req.params.goalId, user: req.user });

  return sendResponse(res, {
    success: true,
    message: 'Goal paused successfully',
    data: { goal },
    errors: [],
  });
});

const resumeGoalController = asyncHandler(async (req, res) => {
  const goal = await resumeGoal({ goalId: req.params.goalId, user: req.user });

  return sendResponse(res, {
    success: true,
    message: 'Goal resumed successfully',
    data: { goal },
    errors: [],
  });
});

const archiveGoalController = asyncHandler(async (req, res) => {
  const goal = await archiveGoal({ goalId: req.params.goalId, user: req.user });

  return sendResponse(res, {
    success: true,
    message: 'Goal archived successfully',
    data: { goal },
    errors: [],
  });
});

const completeGoalController = asyncHandler(async (req, res) => {
  const goal = await completeGoal({ goalId: req.params.goalId, user: req.user });

  return sendResponse(res, {
    success: true,
    message: 'Goal marked as completed successfully',
    data: { goal },
    errors: [],
  });
});

const duplicateGoalController = asyncHandler(async (req, res) => {
  const goal = await duplicateGoal({ goalId: req.params.goalId, user: req.user, title: req.body.title });

  return sendResponse(res, {
    success: true,
    message: 'Goal duplicated successfully',
    data: { goal },
    errors: [],
  }, 201);
});

module.exports = {
  listGoalsController,
  createGoalController,
  getGoalController,
  updateGoalController,
  deleteGoalController,
  pauseGoalController,
  resumeGoalController,
  archiveGoalController,
  completeGoalController,
  duplicateGoalController,
};
