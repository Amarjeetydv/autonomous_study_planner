const PlanningJob = require('../../../models/PlanningJob');
const AIPlan = require('../../../models/AIPlan');
const aiPlanningService = require('../aiPlanning.service');
const logger = require('../../../config/logger');
const AppError = require('../../../utils/errors/AppError');
const eventEmitter = require('../../../services/eventEmitter.service');

class JobManager {
  constructor() {
    this.activeWorkers = 0;
    this.maxWorkers = 2;
    this.queue = [];
  }

  async createJob({ studentId, goalId, options = {} }) {
    const job = await PlanningJob.create({
      studentId,
      goalId,
      status: 'queued',
      progressPercentage: 0,
      startTime: new Date(),
    });

    this.queue.push({ 
      jobId: job._id.toString(), 
      studentId: studentId.toString(), 
      goalId: goalId.toString(), 
      options 
    });
    
    // Defer processing to event loop
    setImmediate(() => this.processQueue());

    return job;
  }

  async processQueue() {
    if (this.activeWorkers >= this.maxWorkers || this.queue.length === 0) {
      return;
    }

    const { jobId, studentId, goalId, options } = this.queue.shift();
    
    // Double check that job was not cancelled while queued
    const currentJob = await PlanningJob.findById(jobId);
    if (!currentJob || currentJob.status === 'cancelled') {
      this.processQueue();
      return;
    }

    this.activeWorkers++;

    this.runJob(jobId, studentId, goalId, options).finally(() => {
      this.activeWorkers--;
      this.processQueue();
    });
  }

  async runJob(jobId, studentId, goalId, options) {
    try {
      await PlanningJob.findByIdAndUpdate(jobId, { 
        status: 'running', 
        startTime: new Date() 
      });

      const user = { _id: studentId, id: studentId, roles: ['Student'] };
      
      const result = await aiPlanningService.generatePlan({
        user,
        goalId,
        options,
        onProgress: async (stage, progress) => {
          // Check for dynamic cancellation
          const jobCheck = await PlanningJob.findById(jobId);
          if (jobCheck && jobCheck.status === 'cancelled') {
            throw new AppError('Planning job cancelled by user', 499);
          }

          await PlanningJob.findByIdAndUpdate(jobId, {
            currentStage: stage,
            progressPercentage: progress,
            $addToSet: { completedStages: stage }
          });

          eventEmitter.emit(`job:${jobId}:progress`, { stage, progress, status: 'running' });
        }
      });

      const dailyTasksService = require('../../tasks/tasks.service');
      await dailyTasksService.createTasksFromPlan(result);

      await PlanningJob.findByIdAndUpdate(jobId, {
        status: 'completed',
        progressPercentage: 100,
        endTime: new Date(),
        resultPlanId: result.id || result._id,
      });

      try {
        const gamificationService = require('../../gamification/gamification.service');
        await gamificationService.addXP(studentId, 200, 'AI Study Plan Generated');
        await gamificationService.evaluateAchievements(studentId, 'plan_count', 1);
      } catch (err) {
        logger.error('Failed to trigger plan_count gamification achievements update', { error: err.message });
      }

      eventEmitter.emit(`job:${jobId}:completed`, { status: 'completed', planId: result.id || result._id });
    } catch (err) {
      const isCancelled = err.statusCode === 499;
      logger.error('Planning job finished execution', { jobId, error: err.message, stack: err.stack, cancelled: isCancelled });
      
      await PlanningJob.findByIdAndUpdate(jobId, {
        status: isCancelled ? 'cancelled' : 'failed',
        endTime: new Date(),
        errorMessage: err.message,
      });

      if (isCancelled) {
        eventEmitter.emit(`job:${jobId}:cancelled`, { status: 'cancelled', message: err.message });
      } else {
        eventEmitter.emit(`job:${jobId}:error`, { status: 'failed', message: err.message });
      }
    }
  }

  async getJob(jobId) {
    const job = await PlanningJob.findById(jobId).lean();
    if (!job) {
      throw new AppError('Job not found', 404);
    }
    return job;
  }

  async cancelJob(jobId) {
    // 1. Remove from in-memory queue if queued
    const index = this.queue.findIndex(item => item.jobId === jobId);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }

    // 2. Set DB state to cancelled
    const job = await PlanningJob.findByIdAndUpdate(
      jobId, 
      { status: 'cancelled', endTime: new Date(), errorMessage: 'Job cancelled by user' },
      { new: true }
    );

    if (!job) {
      throw new AppError('Job not found', 404);
    }

    return job;
  }

  async getJobResult(jobId) {
    const job = await this.getJob(jobId);
    if (job.status !== 'completed') {
      throw new AppError(`Result not ready. Job status: ${job.status}`, 400);
    }
    if (!job.resultPlanId) {
      throw new AppError('Plan ID missing from completed job metadata', 500);
    }

    const plan = await AIPlan.findById(job.resultPlanId).lean();
    if (!plan) {
      throw new AppError('Associated AI Plan not found in database', 404);
    }

    return plan;
  }
}

module.exports = new JobManager();
