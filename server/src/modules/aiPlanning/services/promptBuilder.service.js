const { AI_STAGES } = require('../aiPlanning.constants');
const { buildGoalAnalyzerPrompt } = require('../prompts/goal.prompt');
const { buildSubjectPrioritizerPrompt } = require('../prompts/subjectPrioritizer.prompt');
const { buildSchedulerPrompt } = require('../prompts/scheduler.prompt');
const { buildRevisionPrompt } = require('../prompts/revision.prompt');
const { buildMockTestPrompt } = require('../prompts/mockTest.prompt');
const { buildMotivationPrompt } = require('../prompts/motivation.prompt');

const promptBuilders = {
  [AI_STAGES.GOAL_ANALYZER]: buildGoalAnalyzerPrompt,
  [AI_STAGES.SUBJECT_PRIORITIZER]: buildSubjectPrioritizerPrompt,
  [AI_STAGES.SCHEDULE_GENERATOR]: buildSchedulerPrompt,
  [AI_STAGES.REVISION_PLANNER]: buildRevisionPrompt,
  [AI_STAGES.MOCK_TEST_PLANNER]: buildMockTestPrompt,
  [AI_STAGES.MOTIVATION]: buildMotivationPrompt,
};

const buildPromptBundle = (stage, input = {}) => {
  const builder = promptBuilders[stage];

  if (!builder) {
    throw new Error(`Unknown AI stage: ${stage}`);
  }

  const bundle = builder(input);

  return {
    stage,
    promptVersion: bundle.promptVersion,
    systemPrompt: bundle.systemPrompt,
    userPrompt: bundle.userPrompt,
  };
};

module.exports = {
  buildPromptBundle,
};
