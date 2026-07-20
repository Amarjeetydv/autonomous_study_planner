const AppError = require('../../../utils/AppError');
const logger = require('../../../config/logger');

const assertObject = (value, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    logger.warn(`AI plan schema warning: ${label} is not a valid object`, { value });
    return {};
  }
  return value;
};

const assertArray = (value, label) => {
  if (!Array.isArray(value)) {
    logger.warn(`AI plan schema warning: ${label} is not a valid array`, { value });
    return [];
  }
  return value;
};

const validateAgentPayload = (payload, label) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    logger.warn(`AI agent payload warning: ${label} returned non-object structure`, { payload });
    return {};
  }
  return payload;
};

const validateGeneratedPlan = (plan) => {
  if (!plan || typeof plan !== 'object') {
    logger.error('Invalid AI plan structure provided to validator', { plan });
    throw new AppError('AI plan generation produced an invalid structure', 422);
  }

  const requiredObjectSections = ['goalAnalysis', 'studyPlan', 'scheduler', 'quizPlan', 'motivation', 'progressAnalysis', 'aiMetadata'];
  const requiredArraySections = ['dailyTasks', 'weeklyTasks', 'monthlyTasks', 'revisionPlan', 'quizSchedule'];

  requiredObjectSections.forEach((section) => {
    plan[section] = assertObject(plan[section], section);
  });

  requiredArraySections.forEach((section) => {
    plan[section] = assertArray(plan[section], section);
  });

  if (!plan.promptVersion || typeof plan.promptVersion !== 'string') {
    plan.promptVersion = '2026-07-20.1';
  }

  if (!plan.generatedAt) {
    plan.generatedAt = new Date();
  }

  return plan;
};

module.exports = {
  validateAgentPayload,
  validateGeneratedPlan,
};
