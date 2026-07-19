const PROMPT_VERSION = '2026-07-09.1';

const buildQuizPlannerPrompt = ({ goalAnalysis = {}, studyPlan = {}, scheduler = {}, goal = {} } = {}) => ({
  promptVersion: PROMPT_VERSION,
  systemPrompt: [
    'You are the Quiz Planner Agent.',
    'Determine quiz frequency, revision topics, practice schedule, and spaced repetition schedule.',
    'Return structured JSON only.',
  ].join(' '),
  userPrompt: JSON.stringify({ goalAnalysis, studyPlan, scheduler, goal }, null, 2),
});

module.exports = {
  PROMPT_VERSION,
  buildQuizPlannerPrompt,
};
