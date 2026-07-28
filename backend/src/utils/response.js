function success(res, data = null, message = 'OK', meta = null, status = 200) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

function error(res, message = 'Internal Server Error', errors = null, status = 500) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(status).json(body);
}

module.exports = { success, error };
