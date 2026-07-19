const { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT, SORT_ORDER } = require('../constants');
const { QUERY_MODES } = require('../enums');
const {
  escapeRegex,
  parsePositiveInt,
  compactObject,
  buildDateRangeQuery,
} = require('../utils');

const normalizePagination = ({ page, limit } = {}) => {
  const normalizedPage = parsePositiveInt(page, DEFAULT_PAGE);
  const normalizedLimit = Math.min(parsePositiveInt(limit, DEFAULT_LIMIT), MAX_LIMIT);
  const skip = (normalizedPage - 1) * normalizedLimit;

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip,
  };
};

const buildPagination = ({ page, limit, totalItems = 0 } = {}) => {
  const normalized = normalizePagination({ page, limit });

  return {
    ...normalized,
    totalItems,
    totalPages: totalItems > 0 ? Math.ceil(totalItems / normalized.limit) : 0,
  };
};

const buildSearchQuery = ({ keyword, fields = [], mode = QUERY_MODES.MULTI_FIELD } = {}) => {
  if (!keyword || !fields.length) {
    return {};
  }

  const regex = new RegExp(escapeRegex(String(keyword).trim()), 'i');

  if (mode === QUERY_MODES.KEYWORD) {
    return {
      $text: { $search: String(keyword).trim() },
    };
  }

  return {
    $or: fields.map((field) => ({ [field]: regex })),
  };
};

const buildSortQuery = ({ sortBy = 'createdAt', sortOrder = SORT_ORDER.DESC, sortColumns = [] } = {}) => {
  const direction = String(sortOrder).toLowerCase() === SORT_ORDER.ASC ? 1 : -1;

  if (Array.isArray(sortColumns) && sortColumns.length > 0) {
    return sortColumns.reduce((accumulator, column) => {
      if (!column) {
        return accumulator;
      }

      if (typeof column === 'string') {
        accumulator[column] = direction;
        return accumulator;
      }

      if (column.field) {
        accumulator[column.field] = String(column.order || sortOrder).toLowerCase() === SORT_ORDER.ASC ? 1 : -1;
      }

      return accumulator;
    }, {});
  }

  if (typeof sortBy === 'string' && sortBy.includes(',')) {
    return sortBy.split(',').reduce((accumulator, field) => {
      const cleanedField = field.trim();

      if (!cleanedField) {
        return accumulator;
      }

      if (cleanedField.startsWith('-')) {
        accumulator[cleanedField.slice(1)] = -1;
      } else {
        accumulator[cleanedField] = 1;
      }

      return accumulator;
    }, {});
  }

  return { [sortBy]: direction };
};

const buildFilterQuery = ({ filters = {}, statusField = 'status', dateField = 'createdAt' } = {}) => {
  const query = compactObject({ ...filters });

  if (query.status && Array.isArray(query.status)) {
    query[statusField] = { $in: query.status };
    delete query.status;
  } else if (query.status) {
    query[statusField] = query.status;
    delete query.status;
  }

  if (query.from || query.to) {
    Object.assign(query, buildDateRangeQuery({ from: query.from, to: query.to, field: dateField }));
    delete query.from;
    delete query.to;
  }

  return query;
};

const buildListQuery = ({ keyword, searchFields = [], filters = {}, dateField, sortBy, sortOrder, page, limit } = {}) => {
  const pagination = normalizePagination({ page, limit });
  const searchQuery = buildSearchQuery({ keyword, fields: searchFields });
  const filterQuery = buildFilterQuery({ filters, dateField });
  const sortQuery = buildSortQuery({ sortBy, sortOrder });

  return {
    query: {
      ...searchQuery,
      ...filterQuery,
    },
    sortQuery,
    pagination,
  };
};

module.exports = {
  normalizePagination,
  buildPagination,
  buildSearchQuery,
  buildSortQuery,
  buildFilterQuery,
  buildListQuery,
};
