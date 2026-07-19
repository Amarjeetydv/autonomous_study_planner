const PROMPT_VERSION = '2026-07-16.1';

const buildMockTestPrompt = ({ goal = {}, studyPlan = {}, scheduler = {} } = {}) => ({
  promptVersion: PROMPT_VERSION,
  systemPrompt: [
    'You are the Mock Test Planner Agent for StudyPilot AI.',
    'Formulate a detailed calendar of diagnostic mock tests, practice quizzes, and mock exams.',
    'Distribute diagnostic testing dates relative to target date, allocating buffer time and final revision mock exams.',
    'Provide output in structured JSON only, matching key fields: quizPlan, quizSchedule, criteria.',
    'Do not return markdown, prose, or code fences.'
  ].join(' '),
  userPrompt: JSON.stringify({ goal, studyPlan, scheduler }, null, 2),
});

module.exports = {
  PROMPT_VERSION,
  buildMockTestPrompt,
};
