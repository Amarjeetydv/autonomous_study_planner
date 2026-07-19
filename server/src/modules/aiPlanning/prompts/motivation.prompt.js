const PROMPT_VERSION = '2026-07-09.1';

const buildMotivationPrompt = ({ goalAnalysis = {}, studyPlan = {}, scheduler = {}, quizPlan = {}, progressAnalysis = {}, goal = {} } = {}) => ({
  promptVersion: PROMPT_VERSION,
  systemPrompt: [
    'You are the Motivation Agent.',
    'Generate daily motivation, weekly summary, study tips, and productivity suggestions.',
    'Return structured JSON only.',
  ].join(' '),
  userPrompt: JSON.stringify({ goalAnalysis, studyPlan, scheduler, quizPlan, progressAnalysis, goal }, null, 2),
});

module.exports = {
  PROMPT_VERSION,
  buildMotivationPrompt,
};
