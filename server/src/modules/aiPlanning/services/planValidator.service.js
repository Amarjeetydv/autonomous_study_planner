const AppError = require('../../../utils/errors/AppError');

const assertObject = (value, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError(`${label} must be an object`, 422);
  }
};

const assertArray = (value, label) => {
  if (!Array.isArray(value)) {
    throw new AppError(`${label} must be an array`, 422);
  }
};

const validateAgentPayload = (payload, label) => {
  assertObject(payload, label);
  return payload;
};

const validateGeneratedPlan = (plan) => {
  assertObject(plan, 'AI plan');

  const requiredObjectSections = ['goalAnalysis', 'studyPlan', 'scheduler', 'quizPlan', 'motivation', 'progressAnalysis', 'aiMetadata'];
  const requiredArraySections = ['dailyTasks', 'weeklyTasks', 'monthlyTasks', 'revisionPlan', 'quizSchedule'];

  requiredObjectSections.forEach((section) => assertObject(plan[section], section));
  requiredArraySections.forEach((section) => assertArray(plan[section], section));

  if (!plan.promptVersion || typeof plan.promptVersion !== 'string') {
    throw new AppError('promptVersion is required on the AI plan', 422);
  }

  if (!plan.generatedAt) {
    throw new AppError('generatedAt is required on the AI plan', 422);
  }

  return plan;
};

module.exports = {
  validateAgentPayload,
  validateGeneratedPlan,
};
