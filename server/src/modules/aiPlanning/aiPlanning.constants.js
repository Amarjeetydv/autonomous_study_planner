const AI_PLAN_STATUSES = {
  DRAFT: 'draft',
  GENERATED: 'generated',
  VALIDATED: 'validated',
  REJECTED: 'rejected',
  ARCHIVED: 'archived',
};

const AI_STAGES = {
  GOAL_ANALYZER: 'goalAnalyzer',
  SUBJECT_PRIORITIZER: 'subjectPrioritizer',
  SCHEDULE_GENERATOR: 'scheduleGenerator',
  REVISION_PLANNER: 'revisionPlanner',
  MOCK_TEST_PLANNER: 'mockTestPlanner',
  MOTIVATION: 'motivation',
};

const env = require('../../config/env');

const AI_PROMPT_VERSION = '2026-07-16.1';

const AI_DEFAULTS = {
  model: env.gemini?.model || 'gemini-1.5-flash',
  temperature: env.gemini?.temperature || 0.4,
  timeoutMs: env.gemini?.timeoutMs || 60000,
  maxRetries: env.gemini?.maxRetries || 2,
  streamEnabled: true,
};

module.exports = {
  AI_PLAN_STATUSES,
  AI_STAGES,
  AI_PROMPT_VERSION,
  AI_DEFAULTS,
};
