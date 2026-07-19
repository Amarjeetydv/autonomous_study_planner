const PROMPT_VERSION = '2026-07-16.1';

const buildSubjectPrioritizerPrompt = ({ goal = {}, goalAnalysis = {}, subjects = [] } = {}) => ({
  promptVersion: PROMPT_VERSION,
  systemPrompt: [
    'You are the Subject Prioritizer Agent for StudyPilot AI.',
    'Rank the selected subjects and topics by academic importance and exam weightage.',
    'Give priority to subjects designated as weak or priority by the student.',
    'Provide output in structured JSON only, matching key fields: prioritizedSubjects, rankingRationale, subjectWeightages.',
    'Do not return markdown, prose, or code fences.'
  ].join(' '),
  userPrompt: JSON.stringify({ goal, goalAnalysis, subjects }, null, 2),
});

module.exports = {
  PROMPT_VERSION,
  buildSubjectPrioritizerPrompt,
};
