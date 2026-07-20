const asyncHandler = require('../../middlewares/asyncHandler');
const { sendResponse, sendPaginatedResponse } = require('../../utils/response');
const { generatePlan, getPlan, listGeneratedPlans, listMyPlans, removePlan } = require('./aiPlanning.service');
const jobManager = require('./services/jobManager.service');

const listMyPlansController = asyncHandler(async (req, res) => {
  const plans = await listMyPlans({ user: req.user });
  return sendResponse(res, {
    success: true,
    message: 'My plans fetched successfully',
    data: { plans },
    errors: [],
  });
});

const generatePlanController = asyncHandler(async (req, res) => {
  const goalId = req.body.goalId;
  const options = req.body;
  const studentId = req.user._id || req.user.id;

  const job = await jobManager.createJob({ studentId, goalId, options });

  return sendResponse(res, {
    success: true,
    message: 'Study planning job enqueued',
    data: { 
      jobId: job._id.toString(), 
      status: job.status 
    },
    errors: [],
  }, 202);
});

const getPlanController = asyncHandler(async (req, res) => {
  const plan = await getPlan({ planId: req.params.planId, user: req.user });

  return sendResponse(res, {
    success: true,
    message: 'AI plan fetched successfully',
    data: { plan },
    errors: [],
  });
});

const listPlansController = asyncHandler(async (req, res) => {
  const result = await listGeneratedPlans({ user: req.user, query: req.query });

  return sendPaginatedResponse(res, {
    message: 'AI plans fetched successfully',
    items: result.items,
    pagination: result.pagination,
  });
});

const deletePlanController = asyncHandler(async (req, res) => {
  await removePlan({ planId: req.params.planId, user: req.user });

  return sendResponse(res, {
    success: true,
    message: 'AI plan deleted successfully',
    data: null,
    errors: [],
  });
});

// Async Job Operations
const getJobController = asyncHandler(async (req, res) => {
  const job = await jobManager.getJob(req.params.jobId);
  return sendResponse(res, {
    success: true,
    message: 'Job details fetched successfully',
    data: { job },
    errors: [],
  });
});

const getJobStatusController = asyncHandler(async (req, res) => {
  const job = await jobManager.getJob(req.params.jobId);
  return sendResponse(res, {
    success: true,
    message: 'Job status fetched successfully',
    data: {
      jobId: job._id.toString(),
      status: job.status,
      currentStage: job.currentStage,
      completedStages: job.completedStages,
      progressPercentage: job.progressPercentage,
      startTime: job.startTime,
      endTime: job.endTime,
      errorMessage: job.errorMessage,
    },
    errors: [],
  });
});

const getJobResultController = asyncHandler(async (req, res) => {
  const plan = await jobManager.getJobResult(req.params.jobId);
  return sendResponse(res, {
    success: true,
    message: 'Job result fetched successfully',
    data: { plan },
    errors: [],
  });
});

const cancelJobController = asyncHandler(async (req, res) => {
  const job = await jobManager.cancelJob(req.params.jobId);
  return sendResponse(res, {
    success: true,
    message: 'Job cancelled successfully',
    data: { jobId: job._id.toString(), status: job.status },
    errors: [],
  });
});

module.exports = {
  listMyPlansController,
  generatePlanController,
  getPlanController,
  listPlansController,
  deletePlanController,
  getJobController,
  getJobStatusController,
  getJobResultController,
  cancelJobController,
};
