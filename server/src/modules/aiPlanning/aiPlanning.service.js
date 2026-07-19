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

  const subjectIds = normalizeIdList([...(goal.selectedSubjects || []), ...(goal.strongSubjects || []), ...(goal.weakSubjects || []), ...(goal.prioritySubjects || [])]);
  const [subjects, progressDocs] = await Promise.all([
    subjectIds.length > 0 ? Subject.find({ _id: { $in: subjectIds } }).lean() : Promise.resolve([]),
    Progress.find({ studentId: goal.studentId, goalId: goal._id }).sort({ snapshotDate: -1 }).limit(10).lean(),
  ]);

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

const generatePlan = async ({ user, goalId, options = {}, onProgress = null }) => {
  const context = await loadGoalContext({ goalId, user });
  const { goal, progressDocs } = context;
  const model = options.model || AI_DEFAULTS.model;
  const temperature = options.temperature ?? AI_DEFAULTS.temperature;
  const retries = options.retries ?? AI_DEFAULTS.maxRetries;
  const timeoutMs = options.timeoutMs ?? AI_DEFAULTS.timeoutMs;
  const stream = Boolean(options.stream);

  const goalAnalysisStage = await runGoalAnalyzerAgent({ goal, subjects: context.subjects, progress: progressDocs, model, temperature, retries, timeoutMs, stream });
  if (onProgress) await onProgress('goalAnalyzer', 15);

  const subjectPrioritizerStage = await runSubjectPrioritizerAgent({ goal, goalAnalysis: goalAnalysisStage.output, subjects: context.subjects, model, temperature, retries, timeoutMs, stream });
  if (onProgress) await onProgress('subjectPrioritizer', 30);

  const schedulerStage = await runSchedulerAgent({ goal, goalAnalysis: goalAnalysisStage.output, studyPlan: subjectPrioritizerStage.output, model, temperature, retries, timeoutMs, stream });
  if (onProgress) await onProgress('scheduleGenerator', 50);

  const revisionStage = await runRevisionPlannerAgent({ goal, goalAnalysis: goalAnalysisStage.output, studyPlan: subjectPrioritizerStage.output, model, temperature, retries, timeoutMs, stream });
  if (onProgress) await onProgress('revisionPlanner', 70);

  const mockTestStage = await runMockTestPlannerAgent({ goal, studyPlan: subjectPrioritizerStage.output, scheduler: schedulerStage.output, model, temperature, retries, timeoutMs, stream });
  if (onProgress) await onProgress('mockTestPlanner', 90);

  const motivationStage = await runMotivationAgent({ goal, goalAnalysis: goalAnalysisStage.output, studyPlan: subjectPrioritizerStage.output, scheduler: schedulerStage.output, quizPlan: mockTestStage.output, progressAnalysis: {}, model, temperature, retries, timeoutMs, stream });
  if (onProgress) await onProgress('motivation', 100);

  const finalPlan = validateGeneratedPlan({
    studentId: goal.studentId,
    goalId: goal._id,
    studyPlanId: options.studyPlanId || null,
    progressId: progressDocs[0]?._id || null,
    status: AI_PLAN_STATUSES.GENERATED,
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

  const savedPlan = await createPlan(finalPlan);

  return mapPlanRecord(savedPlan);
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

const removePlan = async ({ planId, user }) => {
  const plan = await findPlanById(planId);

  if (!plan) {
    throw new AppError('AI plan not found', 404);
  }

  ensureGoalAccess({ studentId: plan.studentId }, user);

  await deletePlanById(planId);

  return { deleted: true };
};

module.exports = {
  generatePlan,
  getPlan,
  listGeneratedPlans,
  removePlan,
};
