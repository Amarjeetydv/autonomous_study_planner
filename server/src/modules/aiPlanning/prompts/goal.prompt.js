const PROMPT_VERSION = '2026-07-09.1';

const buildGoalAnalyzerPrompt = ({ goal = {}, subjects = [], progress = [] } = {}) => ({
  promptVersion: PROMPT_VERSION,
  systemPrompt: [
    'You are the Goal Analyzer Agent for an autonomous study planner.',
    'Analyze the user goal and return structured JSON only.',
    'Do not write markdown, prose, or code fences.',
    'Output keys: goalAnalysis, estimatedWorkload, importantSubjects, weakAreas, requiredStudyHours, riskFactors.',
  ].join(' '),
  userPrompt: JSON.stringify({ goal, subjects, progress }, null, 2),
});

module.exports = {
  PROMPT_VERSION,
  buildGoalAnalyzerPrompt,
};
