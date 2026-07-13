const { error } = require('../utils/response');

function errorHandler(err, req, res, _next) {
  console.error('[ERROR]', err);

  if (err.status) {
    return error(res, err.message, null, err.status);
  }

  if (err.code === 'PGRST301') {
    return error(res, 'Database connection failed', null, 503);
  }

  if (err.message?.includes('duplicate key')) {
    return error(res, 'Data already exists', null, 409);
  }

  return error(res, 'Internal Server Error', null, 500);
}

module.exports = errorHandler;
