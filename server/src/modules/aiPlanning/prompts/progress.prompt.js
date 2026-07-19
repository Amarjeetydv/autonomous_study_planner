const PROMPT_VERSION = '2026-07-09.1';

const buildProgressPrompt = ({ goal = {}, progress = [], studyPlan = {}, quizPlan = {} } = {}) => ({
  promptVersion: PROMPT_VERSION,
  systemPrompt: [
    'You are the Progress Analyzer Agent.',
    'Analyze completion percentage, weak subjects, missed days, learning trends, and risk prediction.',
    'Return structured JSON only.',
  ].join(' '),
  userPrompt: JSON.stringify({ goal, progress, studyPlan, quizPlan }, null, 2),
});

module.exports = {
  PROMPT_VERSION,
  buildProgressPrompt,
};
