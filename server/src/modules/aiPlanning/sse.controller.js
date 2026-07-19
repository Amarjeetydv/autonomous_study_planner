const asyncHandler = require('../../middlewares/asyncHandler');
const sseService = require('./sse.service');

const subscribeToJobStreamController = asyncHandler(async (req, res) => {
  await sseService.subscribeToJobStream(req, res, req.params.jobId, req.user);
});

module.exports = {
  subscribeToJobStreamController,
};
