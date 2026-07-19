const PROMPT_VERSION = '2026-07-16.1';

const buildSchedulerPrompt = ({ studyPlan = {}, goalAnalysis = {}, goal = {} } = {}) => ({
  promptVersion: PROMPT_VERSION,
  systemPrompt: [
    'You are the Schedule Generator Agent for StudyPilot AI.',
    'Optimize daily study hours, weekly study blocks, and a monthly milestones roadmap.',
    'Formulate exact schedules allocating specific buffer days and study rest days.',
    'Provide output in structured JSON only, matching key fields: dailyTasks, weeklyTasks, monthlyTasks, bufferAllocation,RestDays.',
    'Do not return markdown, prose, or code fences.'
  ].join(' '),
  userPrompt: JSON.stringify({ studyPlan, goalAnalysis, goal }, null, 2),
});

module.exports = {
  PROMPT_VERSION,
  buildSchedulerPrompt,
};
