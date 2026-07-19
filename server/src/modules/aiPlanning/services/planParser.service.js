const AppError = require('../../../utils/errors/AppError');
const logger = require('../../../config/logger');

const stripCodeFences = (value = '') => String(value).replace(/```json/gi, '```').replace(/```/g, '').trim();

const extractJsonCandidate = (value = '') => {
  const text = stripCodeFences(value);
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }

  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    return text.slice(firstBracket, lastBracket + 1);
  }

  return text;
};

const repairJsonString = (value = '') => {
  const text = extractJsonCandidate(value)
    .replace(/\u0000/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, '$1');

  return text;
};

const parseStructuredJson = (value, fallbackMessage = 'Invalid AI response') => {
  if (value && typeof value === 'object') {
    return value;
  }

  const candidates = [String(value || ''), repairJsonString(value)];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      continue;
    }
  }

  logger.error('[PLAN PARSER ERROR] Failed to parse JSON. Raw AI Value: ' + String(value));
  throw new AppError(fallbackMessage, 502);
};

module.exports = {
  stripCodeFences,
  extractJsonCandidate,
  repairJsonString,
  parseStructuredJson,
};
