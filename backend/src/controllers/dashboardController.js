const dashboardService = require('../services/dashboardService');
const { success } = require('../utils/response');

exports.getSummary = async (req, res, next) => {
  try {
    const data = await dashboardService.getSummary(req.user.id);
    return success(res, data, 'OK');
  } catch (err) {
    next(err);
  }
};

exports.getDemandForecast = async (req, res, next) => {
  try {
    const data = await dashboardService.getDemandForecast();
    return success(res, data, 'OK');
  } catch (err) {
    next(err);
  }
};

exports.getRecentActivity = async (req, res, next) => {
  try {
    const data = await dashboardService.getRecentActivity(req.user.id);
    return success(res, data, 'OK');
  } catch (err) {
    next(err);
  }
};
