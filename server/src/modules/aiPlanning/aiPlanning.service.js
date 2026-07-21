const mongoose = require('mongoose');
const AppError = require('../../utils/AppError');
const { buildListQuery, buildPagination } = require('../../services/query.service');
const Goal = require('../../models/Goal');
const Subject = require('../../models/Subject');
const Progress = require('../../models/Progress');
const { normalizeIdList, buildGoalSnapshot, buildPlanMetadata } = require('./aiPlanning.utils');
const { AI_DEFAULTS, AI_PLAN_STATUSES } = require('./aiPlanning.constants');
const { createPlan, findPlanById, deletePlanById, listPlans } = require('./aiPlanning.repository');
const { runGoalAnalyzerAgent } = require('./agents/goalAnalyzer.agent');
const { runSubjectPrioritizerAgent } = require('./agents/subjectPrioritizer.agent');
const { runSchedulerAgent } = require('./agents/scheduler.agent');
const { runRevisionPlannerAgent } = require('./agents/revisionPlanner.agent');
const { runMockTestPlannerAgent } = require('./agents/mockTestPlanner.agent');
const { runMotivationAgent } = require('./agents/motivation.agent');
const { validateGeneratedPlan } = require('./services/planValidator.service');

const resolveUserScope = (user) => {
  const roles = user?.roles || [];

  return {
    isStudent: roles.includes('Student'),
    isMentor: roles.includes('Mentor'),
    isAdmin: roles.includes('Admin'),
  };
};

const ensureGoalAccess = (goal, user) => {
  const scope = resolveUserScope(user);

  if (scope.isAdmin || scope.isMentor) {
    return;
  }

  if (!scope.isStudent) {
    throw new AppError('You do not have permission to access this goal', 403);
  }

  if (String(goal.studentId) !== String(user._id || user.id)) {
    throw new AppError('You do not have permission to access this goal', 403);
  }
};

const loadGoalContext = async ({ goalId, user }) => {
  const goal = await Goal.findById(goalId).lean();

  if (!goal) {
    throw new AppError('Goal not found', 404);
  }

  ensureGoalAccess(goal, user);

  const rawSubjectIds = [...(goal.selectedSubjects || []), ...(goal.strongSubjects || []), ...(goal.weakSubjects || []), ...(goal.prioritySubjects || [])];
  const validObjectIds = rawSubjectIds.filter(id => mongoose.Types.ObjectId.isValid(id));
  const customNames = rawSubjectIds.filter(id => typeof id === 'string' && !mongoose.Types.ObjectId.isValid(id) && id.trim().length > 0);

  const [dbSubjects, progressDocs] = await Promise.all([
    validObjectIds.length > 0 ? Subject.find({ _id: { $in: validObjectIds } }).lean() : Promise.resolve([]),
    Progress.find({ studentId: goal.studentId, goalId: goal._id }).sort({ snapshotDate: -1 }).limit(10).lean(),
  ]);

  const customSubjects = customNames.map(name => ({
    _id: name,
    id: name,
    name: name,
    code: name.substring(0, 6).toUpperCase().replace(/\s+/g, '') || 'SUB101',
    category: 'General',
    difficulty: 'Intermediate'
  }));

  const subjects = [...dbSubjects, ...customSubjects];

  return {
    goal,
    subjects,
    progressDocs,
    snapshot: buildGoalSnapshot(goal, subjects, progressDocs),
  };
};

const mapPlanRecord = (record) => ({
  id: record._id,
  goalId: record.goalId,
  studentId: record.studentId,
  status: record.status,
  promptVersion: record.promptVersion,
  generatedAt: record.generatedAt,
  goalAnalysis: record.goalAnalysis,
  studyPlan: record.studyPlan,
  scheduler: record.scheduler,
  quizPlan: record.quizPlan,
  motivation: record.motivation,
  progressAnalysis: record.progressAnalysis,
  dailyTasks: record.dailyTasks,
  weeklyTasks: record.weeklyTasks,
  monthlyTasks: record.monthlyTasks,
  revisionPlan: record.revisionPlan,
  quizSchedule: record.quizSchedule,
  aiMetadata: record.aiMetadata,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});

const aggregateUsage = (stages = []) =>
  stages.reduce(
    (accumulator, stage) => {
      const usage = stage?.usage || {};

      accumulator.promptTokens += usage.promptTokens || 0;
      accumulator.completionTokens += usage.completionTokens || 0;
      accumulator.totalTokens += usage.totalTokens || 0;

      return accumulator;
    },
    { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
  );

const logger = require('../../config/logger');

const executeStageWithTelemetry = async (stageName, fn, onProgress, progressVal) => {
  const startTime = Date.now();
  const startIso = new Date(startTime).toISOString();
  logger.info(`[AI Pipeline] Stage '${stageName}' Started at ${startIso}`);
  
  try {
    const result = await fn();
    const endTime = Date.now();
    const durationSec = ((endTime - startTime) / 1000).toFixed(2);
    logger.info(`[AI Pipeline] Stage '${stageName}' Finished at ${new Date(endTime).toISOString()} | Duration: ${durationSec}s`);
    if (onProgress && progressVal) {
      await onProgress(stageName, progressVal);
    }
    return result;
  } catch (err) {
    const endTime = Date.now();
    const durationSec = ((endTime - startTime) / 1000).toFixed(2);
    logger.error(`[AI Pipeline] Stage '${stageName}' Failed at ${new Date(endTime).toISOString()} | Duration: ${durationSec}s | Error: ${err.message}`);
    throw err;
  }
};

const generatePlan = async ({ user, goalId, options = {}, onProgress = null }) => {
  const context = await loadGoalContext({ goalId, user });
  const { goal, progressDocs } = context;
  const model = options.model || AI_DEFAULTS.model;
  const temperature = options.temperature ?? AI_DEFAULTS.temperature;
  const retries = options.retries ?? AI_DEFAULTS.maxRetries;
  const timeoutMs = options.timeoutMs ?? AI_DEFAULTS.timeoutMs;
  const stream = Boolean(options.stream);

  const goalAnalysisStage = await executeStageWithTelemetry(
    'goalAnalyzer',
    () => runGoalAnalyzerAgent({ goal, subjects: context.subjects, progress: progressDocs, model, temperature, retries, timeoutMs, stream }),
    onProgress, 15
  );

  const subjectPrioritizerStage = await executeStageWithTelemetry(
    'subjectPrioritizer',
    () => runSubjectPrioritizerAgent({ goal, goalAnalysis: goalAnalysisStage.output, subjects: context.subjects, model, temperature, retries, timeoutMs, stream }),
    onProgress, 30
  );

  // Parallelize Scheduler and Revision Planner (independent agents after Subject Prioritization)
  const [schedulerStage, revisionStage] = await Promise.all([
    executeStageWithTelemetry(
      'scheduleGenerator',
      () => runSchedulerAgent({ goal, goalAnalysis: goalAnalysisStage.output, studyPlan: subjectPrioritizerStage.output, model, temperature, retries, timeoutMs, stream })
    ),
    executeStageWithTelemetry(
      'revisionPlanner',
      () => runRevisionPlannerAgent({ goal, goalAnalysis: goalAnalysisStage.output, studyPlan: subjectPrioritizerStage.output, model, temperature, retries, timeoutMs, stream })
    )
  ]);

  if (onProgress) await onProgress('scheduleGenerator', 50);
  if (onProgress) await onProgress('revisionPlanner', 70);

  const mockTestStage = await executeStageWithTelemetry(
    'mockTestPlanner',
    () => runMockTestPlannerAgent({ goal, studyPlan: subjectPrioritizerStage.output, scheduler: schedulerStage.output, model, temperature, retries, timeoutMs, stream }),
    onProgress, 90
  );

  const motivationStage = await executeStageWithTelemetry(
    'motivation',
    () => runMotivationAgent({ goal, goalAnalysis: goalAnalysisStage.output, studyPlan: subjectPrioritizerStage.output, scheduler: schedulerStage.output, quizPlan: mockTestStage.output, progressAnalysis: {}, model, temperature, retries, timeoutMs, stream }),
    onProgress, 100
  );

  const finalPlan = validateGeneratedPlan({
    studentId: goal.studentId,
    goalId: goal._id,
    studyPlanId: options.studyPlanId || null,
    progressId: progressDocs[0]?._id || null,
    status: AI_PLAN_STATUSES.ACTIVE,
    promptVersion: goalAnalysisStage.promptVersion,
    generatedAt: new Date(),
    goalAnalysis: goalAnalysisStage.output,
    studyPlan: subjectPrioritizerStage.output,
    scheduler: schedulerStage.output,
    quizPlan: mockTestStage.output,
    motivation: motivationStage.output,
    progressAnalysis: {},
    dailyTasks: schedulerStage.output.dailyTasks || [],
    weeklyTasks: schedulerStage.output.weeklyTasks || [],
    monthlyTasks: schedulerStage.output.monthlyTasks || [],
    revisionPlan: revisionStage.output.revisionPlan || [],
    quizSchedule: mockTestStage.output.quizSchedule || [],
    aiMetadata: buildPlanMetadata({
      model,
      temperature,
      retries,
      streamed: stream,
      promptVersions: {
        goalAnalyzer: goalAnalysisStage.promptVersion,
        subjectPrioritizer: subjectPrioritizerStage.promptVersion,
        scheduler: schedulerStage.promptVersion,
        revisionPlanner: revisionStage.promptVersion,
        mockTestPlanner: mockTestStage.promptVersion,
        motivation: motivationStage.promptVersion,
      },
      stageUsage: {
        goalAnalyzer: goalAnalysisStage.usage,
        subjectPrioritizer: subjectPrioritizerStage.usage,
        scheduler: schedulerStage.usage,
        revisionPlanner: revisionStage.usage,
        mockTestPlanner: mockTestStage.usage,
        motivation: motivationStage.usage,
      },
      tokenUsage: aggregateUsage([goalAnalysisStage, subjectPrioritizerStage, schedulerStage, revisionStage, mockTestStage, motivationStage]),
      safetySettings: { policy: 'medium_and_above' },
    }),
  });

  // Unset isCurrent on previous plans and goals for this student (do not archive them!)
  const AIPlanModel = require('../../models/AIPlan');
  const GoalModel = require('../../models/Goal');

  await AIPlanModel.updateMany(
    { studentId: goal.studentId },
    { $set: { isCurrent: false } }
  );
  await GoalModel.updateMany(
    { studentId: goal.studentId },
    { $set: { isCurrent: false } }
  );
  await GoalModel.findByIdAndUpdate(goal._id, { $set: { isCurrent: true, status: 'active' } });

  finalPlan.isCurrent = true;
  finalPlan.status = 'active';
  const savedPlan = await createPlan(finalPlan);

  // Automatically insert DailyTask and CalendarEvent documents in MongoDB
  const tasksService = require('../tasks/tasks.service');
  await tasksService.createTasksFromPlan(savedPlan);

  return mapPlanRecord(savedPlan);
};

const activatePlan = async ({ planId, user }) => {
  const studentId = user._id || user.id;
  const AIPlanModel = require('../../models/AIPlan');
  const GoalModel = require('../../models/Goal');

  const plan = await AIPlanModel.findOne({ _id: planId, studentId }).lean();
  if (!plan) {
    throw new AppError('AI plan not found', 404);
  }

  // Unset isCurrent on all plans & goals for student
  await AIPlanModel.updateMany({ studentId }, { $set: { isCurrent: false } });
  await GoalModel.updateMany({ studentId }, { $set: { isCurrent: false } });

  // Set selected plan & its goal to isCurrent = true
  await AIPlanModel.findByIdAndUpdate(planId, { $set: { isCurrent: true, status: 'active' } });
  if (plan.goalId) {
    await GoalModel.findByIdAndUpdate(plan.goalId, { $set: { isCurrent: true, status: 'active' } });
  }

  const updatedPlan = await AIPlanModel.findById(planId).lean();
  return mapPlanRecord(updatedPlan);
};

const getActivePlan = async ({ user }) => {
  const studentId = user._id || user.id;
  const AIPlanModel = require('../../models/AIPlan');

  let plan = await AIPlanModel.findOne({ studentId, isCurrent: true }).sort({ updatedAt: -1 }).lean();
  if (!plan) {
    plan = await AIPlanModel.findOne({ studentId, status: { $ne: 'archived' } }).sort({ createdAt: -1 }).lean();
  }
  if (!plan) return null;
  return mapPlanRecord(plan);
};

const getPlan = async ({ planId, user }) => {
  const plan = await findPlanById(planId);

  if (!plan) {
    throw new AppError('AI plan not found', 404);
  }

  ensureGoalAccess({ studentId: plan.studentId }, user);

  return mapPlanRecord(plan);
};

const listGeneratedPlans = async ({ user, query = {} }) => {
  const scope = resolveUserScope(user);
  const filters = {
    ...(scope.isStudent ? { studentId: user._id || user.id } : {}),
    ...((scope.isAdmin || scope.isMentor) && query.studentId ? { studentId: query.studentId } : {}),
    ...(query.goalId ? { goalId: query.goalId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  const { query: mongoQuery, sortQuery, pagination } = buildListQuery({
    keyword: query.keyword || query.search,
    searchFields: ['promptVersion', 'status'],
    filters,
    sortBy: query.sortBy || 'generatedAt',
    sortOrder: query.sortOrder || 'desc',
    page: query.page,
    limit: query.limit,
  });

  const { totalItems, items } = await listPlans({ query: mongoQuery, sort: sortQuery, skip: pagination.skip, limit: pagination.limit });

  return {
    items: items.map(mapPlanRecord),
    pagination: buildPagination({ page: pagination.page, limit: pagination.limit, totalItems }),
  };
};

const listMyPlans = async ({ user }) => {
  const studentId = user._id || user.id;
  const AIPlan = require('../../models/AIPlan');
  const Goal = require('../../models/Goal');
  const DailyTask = require('../../models/DailyTask');

  const plans = await AIPlan.find({ studentId }).sort({ createdAt: -1 }).lean();
  
  const results = [];
  for (const plan of plans) {
    const goal = await Goal.findById(plan.goalId).lean();
    
    const [totalTasks, completedTasks] = await Promise.all([
      DailyTask.countDocuments({ planId: plan._id }),
      DailyTask.countDocuments({ planId: plan._id, status: 'Completed' })
    ]);
    
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    results.push({
      planId: plan._id.toString(),
      goalId: plan.goalId?.toString() || '',
      goalTitle: goal?.title || 'AI Study Plan',
      category: goal?.goalType || 'CUSTOM',
      createdAt: plan.createdAt,
      progress,
      targetDate: goal?.targetDate,
      status: plan.status,
      isCurrent: Boolean(plan.isCurrent)
    });
  }
  
  return results;
};

const removePlan = async ({ planId, user }) => {
  const plan = await findPlanById(planId);

  if (!plan) {
    throw new AppError('AI plan not found', 404);
  }

  ensureGoalAccess({ studentId: plan.studentId }, user);

  await deletePlanById(planId);

  const DailyTask = require('../../models/DailyTask');
  await DailyTask.deleteMany({ planId });

  return { deleted: true };
};

module.exports = {
  generatePlan,
  getPlan,
  getActivePlan,
  activatePlan,
  listGeneratedPlans,
  listMyPlans,
  removePlan,
};
