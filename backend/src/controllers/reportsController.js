const reportsService = require('../services/reportsService');
const { success } = require('../utils/response');

exports.summary = async (req, res, next) => {
  try {
    const data = await reportsService.summary(req.query);
    return success(res, data, 'OK');
  } catch (err) {
    next(err);
  }
};
