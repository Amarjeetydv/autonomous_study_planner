const { GoogleGenAI, HarmCategory, HarmBlockThreshold } = require('@google/genai');
const env = require('../../../config/env');
const ServiceUnavailableError = require('../../../utils/errors/ServiceUnavailableError');
const logger = require('../../../config/logger');

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
  if (!error) return false;
  const status = error.status || error.response?.status || error.code || error.cause?.code;
  if ([408, 429, 500, 502, 503, 504, 'ECONNRESET', 'ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT'].includes(status)) {
    return true;
  }
  const msg = String(error.message || '').toLowerCase();
  return msg.includes('fetch failed') || msg.includes('timeout') || msg.includes('high demand') || msg.includes('unavailable') || msg.includes('quota');
};

const extractRetryDelay = (error) => {
  try {
    const details = error?.details || error?.response?.details || [];
    for (const detail of details) {
      if (detail?.retryDelay) {
        const seconds = parseFloat(String(detail.retryDelay).replace('s', ''));
        if (!isNaN(seconds) && seconds > 0) return Math.ceil(seconds * 1000) + 1500;
      }
    }
  } catch (e) {
    // Ignore parsing issues
  }
  return 0;
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

      const delayFromApi = extractRetryDelay(error);
      const backoffDelay = delayFromApi > 0 ? delayFromApi : Math.pow(2, attempt + 1) * 1000;
      logger.warn(`[Gemini API] Retrying stage '${stage}' (attempt ${attempt + 1}/${retries}) after ${backoffDelay}ms due to: ${error.message}`);
      await sleep(backoffDelay);
    }
  }

  throw lastError;
};

module.exports = {
  runGeminiStage,
  extractUsage,
  safetySettings,
};
