const { AI_STAGES, AI_DEFAULTS } = require('../aiPlanning.constants');
const { buildPromptBundle } = require('../services/promptBuilder.service');
const { runGeminiStage } = require('../services/gemini.service');
const { parseStructuredJson } = require('../services/planParser.service');
const { validateAgentPayload } = require('../services/planValidator.service');

const runProgressAnalyzerAgent = async (input = {}) => {
  const prompt = buildPromptBundle(AI_STAGES.PROGRESS_ANALYZER, input);
  const result = await runGeminiStage({ stage: AI_STAGES.PROGRESS_ANALYZER, ...prompt, model: input.model || AI_DEFAULTS.model, temperature: input.temperature ?? AI_DEFAULTS.temperature, timeoutMs: input.timeoutMs, retries: input.retries, stream: input.stream });
  const output = validateAgentPayload(parseStructuredJson(result.text), 'Progress analysis');

  return {
    stage: AI_STAGES.PROGRESS_ANALYZER,
    promptVersion: prompt.promptVersion,
    output,
    usage: result.usage,
  };
};

module.exports = {
  runProgressAnalyzerAgent,
};
