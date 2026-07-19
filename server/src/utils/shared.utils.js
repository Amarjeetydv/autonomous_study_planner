const mongoose = require('mongoose');

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const toObjectId = (value) => (isValidObjectId(value) ? new mongoose.Types.ObjectId(value) : null);

const parsePositiveInt = (value, fallback) => {
  const parsedValue = Number.parseInt(value, 10);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
};

const omitFields = (object = {}, fields = []) => {
  const cloned = { ...object };

  fields.forEach((field) => {
    delete cloned[field];
  });

  return cloned;
};

const compactObject = (object = {}) =>
  Object.entries(object).reduce((accumulator, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      accumulator[key] = value;
    }

    return accumulator;
  }, {});

const buildDateRangeQuery = ({ from, to, field = 'createdAt' } = {}) => {
  const query = {};

  if (from || to) {
    query[field] = {};
  }

  if (from) {
    query[field].$gte = new Date(from);
  }

  if (to) {
    query[field].$lte = new Date(to);
  }

  return query;
};

module.exports = {
  escapeRegex,
  isValidObjectId,
  toObjectId,
  parsePositiveInt,
  omitFields,
  compactObject,
  buildDateRangeQuery,
};
