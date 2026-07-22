const notificationService = require('../services/notificationService');
const { success, error } = require('../utils/response');

exports.list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await notificationService.listNotifications(req.user.id, Number(page), Number(limit));
    return success(res, result.data, 'OK', result.meta);
  } catch (err) {
    next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const data = await notificationService.markAsRead(req.params.id, req.user.id);
    if (!data) return error(res, 'Notifikasi tidak ditemukan', null, 404);
    return success(res, data, 'Ditandai sudah dibaca');
  } catch (err) {
    next(err);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    return success(res, null, 'Semua notifikasi ditandai sudah dibaca');
  } catch (err) {
    next(err);
  }
};

exports.unreadCount = async (req, res, next) => {
  try {
    const result = await notificationService.getUnreadCount(req.user.id);
    return success(res, result, 'OK');
  } catch (err) {
    next(err);
  }
};
