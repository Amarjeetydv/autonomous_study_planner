const PROMPT_VERSION = '2026-07-16.1';

const buildRevisionPrompt = ({ goal = {}, goalAnalysis = {}, studyPlan = {} } = {}) => ({
  promptVersion: PROMPT_VERSION,
  systemPrompt: [
    'You are the Revision Planner Agent for StudyPilot AI.',
    'Formulate a spaced repetition revision plan based on the prioritized study plan.',
    'Map out specific revision dates, intervals, and topics.',
    'Ensure that revision days are balanced and do not conflict with primary study blocks.',
    'Provide output in structured JSON only, matching key fields: revisionPlan, spacedRepetitionIntervals, logic.',
    'Do not return markdown, prose, or code fences.'
  ].join(' '),
  userPrompt: JSON.stringify({ goal, goalAnalysis, studyPlan }, null, 2),
});

module.exports = {
  PROMPT_VERSION,
  buildRevisionPrompt,
};
