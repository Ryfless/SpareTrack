const forecastService = require('../services/forecastService');
const { success, error } = require('../utils/response');

exports.runs = async (req, res, next) => {
  try {
    const data = await forecastService.runs(req.query);
    return success(res, data, 'OK');
  } catch (err) {
    next(err);
  }
};

exports.runDetail = async (req, res, next) => {
  try {
    const data = await forecastService.runDetail(req.params.id);
    if (!data) return error(res, 'Forecast run tidak ditemukan', null, 404);
    return success(res, data, 'OK');
  } catch (err) {
    next(err);
  }
};

exports.createRun = async (req, res, next) => {
  try {
    const data = await forecastService.createRun({
      ...req.body,
      generated_by: req.user.id,
    });
    return success(res, data, 'Forecast run berhasil dibuat', null, 201);
  } catch (err) {
    next(err);
  }
};

exports.series = async (req, res, next) => {
  try {
    const data = await forecastService.series(req.query);
    return success(res, data, 'OK');
  } catch (err) {
    next(err);
  }
};
