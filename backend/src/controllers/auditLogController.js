const auditLogService = require('../services/auditLogService');
const { success, error } = require('../utils/response');

exports.list = async (req, res, next) => {
  try {
    const result = await auditLogService.list(req.query);
    return success(res, result.data, 'OK', result.meta);
  } catch (err) {
    next(err);
  }
};

exports.detail = async (req, res, next) => {
  try {
    const data = await auditLogService.detail(req.params.id);
    if (!data) return error(res, 'Audit log tidak ditemukan', null, 404);
    return success(res, data, 'OK');
  } catch (err) {
    next(err);
  }
};
