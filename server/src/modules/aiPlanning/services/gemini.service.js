const { GoogleGenAI, HarmCategory, HarmBlockThreshold } = require('@google/genai');
const env = require('../../../config/env');
const ServiceUnavailableError = require('../../../utils/errors/ServiceUnavailableError');

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const getGeminiClient = () => {
  if (!env.gemini.apiKey) {
    throw new ServiceUnavailableError('Gemini API key is not configured');
  }

  return new GoogleGenAI({ apiKey: env.gemini.apiKey });
};

const isRetryableError = (error) => {
  const status = error?.status || error?.response?.status || error?.code;
  return [408, 429, 500, 502, 503, 504, 'ECONNRESET', 'ETIMEDOUT'].includes(status);
};

const withTimeout = async (task, timeoutMs, timeoutMessage) => {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new ServiceUnavailableError(timeoutMessage)), timeoutMs);
  });

  try {
    return await Promise.race([task, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const extractUsage = (response = {}) => {
  const usage = response.usageMetadata || response.response?.usageMetadata || {};

  return {
    promptTokens: usage.promptTokenCount || 0,
    completionTokens: usage.candidatesTokenCount || 0,
    totalTokens: usage.totalTokenCount || 0,
  };
};

const runGeminiStage = async ({ stage, systemPrompt, userPrompt, model, temperature, timeoutMs = env.gemini.timeoutMs, retries = env.gemini.maxRetries, stream = false, responseMimeType } = {}) => {
  let lastError;
  const client = getGeminiClient();

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const request = {
        model: model || env.gemini.model,
        contents: userPrompt,
        config: {
          temperature,
          responseMimeType: responseMimeType || 'application/json',
          systemInstruction: systemPrompt,
          safetySettings,
        },
      };

      if (stream) {
        const streamResult = await withTimeout(
          client.models.generateContentStream(request),
          timeoutMs,
          `Gemini ${stage} timed out`
        );

        const chunks = [];
        for await (const chunk of streamResult) {
          if (chunk.text) {
            chunks.push(chunk.text);
          }
        }

        const response = streamResult.response ? await streamResult.response : { text: chunks.join('') };

        return {
          text: chunks.join(''),
          raw: response,
          usage: extractUsage(response),
        };
      }

      const response = await withTimeout(
        client.models.generateContent(request),
        timeoutMs,
        `Gemini ${stage} timed out`
      );

      return {
        text: response.text || '',
        raw: response,
        usage: extractUsage(response),
      };
    } catch (error) {
      lastError = error;

      if (attempt >= retries || !isRetryableError(error)) {
        break;
      }

      await sleep(500 * (attempt + 1));
    }
  }

  throw lastError;
};

module.exports = {
  runGeminiStage,
  extractUsage,
  safetySettings,
};
