const createResponse = ({ success = true, message = '', data = null, errors = [] } = {}) => ({
  success,
  message,
  data,
  errors,
});

const successResponse = (message = '', data = null) => createResponse({ success: true, message, data, errors: [] });

const errorResponse = (message = 'Request failed', errors = [], data = null) =>
  createResponse({ success: false, message, data, errors });

const paginationMeta = ({ page = 1, limit = 10, totalItems = 0 } = {}) => ({
  page,
  limit,
  totalItems,
  totalPages: totalItems > 0 ? Math.ceil(totalItems / limit) : 0,
});

const paginatedResponse = ({ message = 'Request successful', items = [], pagination = {} } = {}) =>
  createResponse({
    success: true,
    message,
    data: {
      items,
      pagination: paginationMeta(pagination),
    },
    errors: [],
  });

const sendResponse = (res, payload = {}, statusCode = 200) => res.status(statusCode).json(createResponse(payload));

const sendPaginatedResponse = (res, { message = 'Request successful', items = [], pagination = {} } = {}, statusCode = 200) =>
  res.status(statusCode).json(paginatedResponse({ message, items, pagination }));

module.exports = {
  createResponse,
  successResponse,
  errorResponse,
  paginationMeta,
  paginatedResponse,
  sendResponse,
  sendPaginatedResponse,
};
