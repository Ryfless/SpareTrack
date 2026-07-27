const branchesService = require('../services/branchesService');
const { success, error } = require('../utils/response');

exports.list = async (req, res, next) => {
  try {
    const data = await branchesService.list();
    return success(res, data, 'OK');
  } catch (err) {
    next(err);
  }
};

exports.getStocks = async (req, res, next) => {
  try {
    const data = await branchesService.getStocks(req.params.id, req.query);
    if (!data) return error(res, 'Cabang tidak ditemukan', null, 404);
    return success(res, data, 'OK');
  } catch (err) {
    next(err);
  }
};

exports.salesTrend = async (req, res, next) => {
  try {
    const data = await branchesService.getSalesTrend();
    return success(res, data, 'OK');
  } catch (err) {
    next(err);
  }
};
