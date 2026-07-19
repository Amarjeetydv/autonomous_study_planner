const PROMPT_VERSION = '2026-07-09.1';

const buildStudyPlannerPrompt = ({ goalAnalysis = {}, goal = {}, progress = [] } = {}) => ({
  promptVersion: PROMPT_VERSION,
  systemPrompt: [
    'You are the Study Planner Agent.',
    'Generate a study plan in structured JSON only.',
    'Return daily, weekly, monthly plans, milestones, and a revision schedule.',
  ].join(' '),
  userPrompt: JSON.stringify({ goalAnalysis, goal, progress }, null, 2),
});

module.exports = {
  PROMPT_VERSION,
  buildStudyPlannerPrompt,
};
