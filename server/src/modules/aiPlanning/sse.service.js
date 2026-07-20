const eventEmitter = require('../../services/eventEmitter.service');
const jobManager = require('./services/jobManager.service');
const AppError = require('../../utils/AppError');
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

  logger.info('[SSE] Client connected', { jobId, userId });

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    // Disable buffering in Nginx/Vercel proxies if applicable
    'X-Accel-Buffering': 'no',
  });

  // Send initial connection event
  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected' })}\n\n`);
  if (typeof res.flush === 'function') {
    res.flush();
  }

  // Immediate catch-up if job has already progressed or completed
  if (job.status === 'completed') {
    logger.info('[SSE] Catch-up: Job already completed', { jobId, planId: job.resultPlanId });
    res.write(`event: completed\ndata: ${JSON.stringify({
      status: 'completed',
      planId: job.resultPlanId
    })}\n\n`);
    res.end();
    return;
  }

  if (job.status === 'failed') {
    logger.info('[SSE] Catch-up: Job already failed', { jobId, error: job.errorMessage });
    res.write(`event: error\ndata: ${JSON.stringify({
      status: 'failed',
      message: job.errorMessage || 'Generation failed'
    })}\n\n`);
    res.end();
    return;
  }

  if (job.status === 'cancelled') {
    logger.info('[SSE] Catch-up: Job already cancelled', { jobId });
    res.write(`event: error\ndata: ${JSON.stringify({
      status: 'cancelled',
      message: job.errorMessage || 'Job cancelled'
    })}\n\n`);
    res.end();
    return;
  }

  const stageMessages = {
    goalAnalyzer: 'Assessing study workload and target timeline',
    subjectPrioritizer: 'Ranking topic weightage and weaknesses',
    scheduleGenerator: 'Structuring daily, weekly study blocks',
    revisionPlanner: 'Injecting spaced repetition study checks',
    mockTestPlanner: 'Scheduling practice quizzes and diagnostic exams',
    motivation: 'Formulating productivity tips and final review',
  };

  if (job.status === 'running') {
    logger.info('[SSE] Catch-up: Job running', { jobId, currentStage: job.currentStage, progress: job.progressPercentage });
    res.write(`event: progress\ndata: ${JSON.stringify({
      stage: job.currentStage,
      progress: job.progressPercentage,
      status: 'running',
      message: stageMessages[job.currentStage] || 'Processing plan stage...'
    })}\n\n`);
    if (typeof res.flush === 'function') {
      res.flush();
    }
  }

  // Event handler mapping
  const onProgress = (data) => {
    logger.info('[SSE] Emitting progress event', { jobId, stage: data.stage, progress: data.progress });
    res.write(`event: progress\ndata: ${JSON.stringify({
      stage: data.stage,
      progress: data.progress,
      status: data.status,
      message: data.message || stageMessages[data.stage] || 'Processing plan stage...'
    })}\n\n`);
    if (typeof res.flush === 'function') {
      res.flush();
    }
  };

  const onCompleted = (data) => {
    logger.info('[SSE] Emitting completed event', { jobId, planId: data.planId });
    res.write(`event: completed\ndata: ${JSON.stringify({
      status: 'completed',
      planId: data.planId
    })}\n\n`);
    if (typeof res.flush === 'function') {
      res.flush();
    }
  };

  const onError = (data) => {
    logger.info('[SSE] Emitting error event', { jobId, message: data.message });
    res.write(`event: error\ndata: ${JSON.stringify({
      status: 'failed',
      message: data.message
    })}\n\n`);
    if (typeof res.flush === 'function') {
      res.flush();
    }
  };

  const onCancelled = (data) => {
    logger.info('[SSE] Emitting cancelled event', { jobId, message: data.message });
    res.write(`event: error\ndata: ${JSON.stringify({
      status: 'cancelled',
      message: data.message
    })}\n\n`);
    if (typeof res.flush === 'function') {
      res.flush();
    }
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
    logger.info('[SSE] Client disconnected and cleaning up listeners', { jobId, userId });
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
