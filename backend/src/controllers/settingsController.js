const settingsService = require('../services/settingsService');
const { success, error } = require('../utils/response');

exports.getSettings = async (req, res, next) => {
  try {
    const data = await settingsService.getSettings(req.user.id);
    return success(res, data, 'OK');
  } catch (err) {
    next(err);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const data = await settingsService.updateSettings(req.user.id, req.body);
    return success(res, data, 'Settings berhasil diupdate');
  } catch (err) {
    next(err);
  }
};
