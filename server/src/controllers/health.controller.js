const { sendResponse } = require('../utils/response');
const asyncHandler = require('../middlewares/asyncHandler');

const getHealth = asyncHandler(async (req, res) => {
  // Keep the health endpoint fast and dependency-light.
  return sendResponse(
    res,
    {
      success: true,
      message: 'Autonomous Study Planner API is healthy',
      data: {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      errors: [],
    },
    200
  );
});

module.exports = { getHealth };
