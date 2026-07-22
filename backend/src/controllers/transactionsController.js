const transactionsService = require('../services/transactionsService');
const { success, error } = require('../utils/response');
const { getClientIp } = require('../utils/ip');

exports.list = async (req, res, next) => {
  try {
    const result = await transactionsService.list(req.query);
    return success(res, result.data, 'OK', result.meta);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { type, sparepart_id, branch_id, quantity } = req.body;
    if (!type || !sparepart_id || !branch_id || quantity === undefined) {
      return error(res, 'type, sparepart_id, branch_id, dan quantity wajib diisi', null, 400);
    }
    const data = await transactionsService.create({
      ...req.body,
      created_by: req.user.id,
      ip_address: getClientIp(req),
    });
    return success(res, data, 'Transaksi berhasil dicatat', null, 201);
  } catch (err) {
    next(err);
  }
};
