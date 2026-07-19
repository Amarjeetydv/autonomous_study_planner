const eventEmitter = require('../../services/eventEmitter.service');
const jobManager = require('./services/jobManager.service');
const AppError = require('../../utils/errors/AppError');
const logger = require('../../config/logger');

const subscribeToJobStream = async (req, res, jobId, user) => {
  const job = await jobManager.getJob(jobId);

  // Security: Check ownership (unless user is Admin or Mentor)
  const userId = (user._id || user.id).toString();
  const isOwner = job.studentId.toString() === userId;
  const isAdminOrMentor = user.roles?.includes('Admin') || user.roles?.includes('Mentor');

  if (!isOwner && !isAdminOrMentor) {
    throw new AppError('Forbidden: You do not have permission to access this job stream', 403);
  }

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    // Disable buffering in Nginx/Vercel proxies if applicable
    'X-Accel-Buffering': 'no',
  });

  // Flush headers if using compression/gzip middleware
  if (typeof res.flush === 'function') {
    res.flush();
  }

  // Send initial connection event
  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected' })}\n\n`);

  // Immediate catch-up if job has already progressed or completed
  if (job.status === 'completed') {
    res.write(`event: completed\ndata: ${JSON.stringify({
      status: 'completed',
      planId: job.resultPlanId
    })}\n\n`);
    res.end();
    return;
  }

  if (job.status === 'failed') {
    res.write(`event: error\ndata: ${JSON.stringify({
      status: 'failed',
      message: job.errorMessage || 'Generation failed'
    })}\n\n`);
    res.end();
    return;
  }

  if (job.status === 'cancelled') {
    res.write(`event: error\ndata: ${JSON.stringify({
      status: 'cancelled',
      message: job.errorMessage || 'Job cancelled'
    })}\n\n`);
    res.end();
    return;
  }

  if (job.status === 'running') {
    res.write(`event: progress\ndata: ${JSON.stringify({
      stage: job.currentStage,
      progress: job.progressPercentage,
      status: 'running'
    })}\n\n`);
  }

  // Event handler mapping
  const onProgress = (data) => {
    res.write(`event: progress\ndata: ${JSON.stringify({
      stage: data.stage,
      progress: data.progress,
      status: data.status
    })}\n\n`);
  };

  const onCompleted = (data) => {
    res.write(`event: completed\ndata: ${JSON.stringify({
      status: 'completed',
      planId: data.planId
    })}\n\n`);
  };

  const onError = (data) => {
    res.write(`event: error\ndata: ${JSON.stringify({
      status: 'failed',
      message: data.message
    })}\n\n`);
  };

  const onCancelled = (data) => {
    res.write(`event: error\ndata: ${JSON.stringify({
      status: 'cancelled',
      message: data.message
    })}\n\n`);
  };

  // Add listeners
  eventEmitter.on(`job:${jobId}:progress`, onProgress);
  eventEmitter.on(`job:${jobId}:completed`, onCompleted);
  eventEmitter.on(`job:${jobId}:error`, onError);
  eventEmitter.on(`job:${jobId}:cancelled`, onCancelled);

  // Set up periodic heartbeat
  const heartbeatInterval = setInterval(() => {
    res.write(`event: heartbeat\ndata: ${JSON.stringify({ status: 'active' })}\n\n`);
  }, 25000);

  // Cleanup handler
  const cleanup = () => {
    logger.info('SSE client disconnected', { jobId, userId });
    clearInterval(heartbeatInterval);
    eventEmitter.off(`job:${jobId}:progress`, onProgress);
    eventEmitter.off(`job:${jobId}:completed`, onCompleted);
    eventEmitter.off(`job:${jobId}:error`, onError);
    eventEmitter.off(`job:${jobId}:cancelled`, onCancelled);
  };

  req.on('close', cleanup);
};

module.exports = {
  subscribeToJobStream,
};
