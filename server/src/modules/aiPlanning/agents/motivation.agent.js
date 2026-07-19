const { AI_STAGES, AI_DEFAULTS } = require('../aiPlanning.constants');
const { buildPromptBundle } = require('../services/promptBuilder.service');
const { runGeminiStage } = require('../services/gemini.service');
const { parseStructuredJson } = require('../services/planParser.service');
const { validateAgentPayload } = require('../services/planValidator.service');

const runMotivationAgent = async (input = {}) => {
  const prompt = buildPromptBundle(AI_STAGES.MOTIVATION, input);
  const result = await runGeminiStage({ stage: AI_STAGES.MOTIVATION, ...prompt, model: input.model || AI_DEFAULTS.model, temperature: input.temperature ?? AI_DEFAULTS.temperature, timeoutMs: input.timeoutMs, retries: input.retries, stream: input.stream });
  const output = validateAgentPayload(parseStructuredJson(result.text), 'Motivation output');

  return {
    stage: AI_STAGES.MOTIVATION,
    promptVersion: prompt.promptVersion,
    output,
    usage: result.usage,
  };
};

module.exports = {
  runMotivationAgent,
};
