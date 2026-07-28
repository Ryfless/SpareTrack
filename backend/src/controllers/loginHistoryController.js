const loginHistoryService = require('../services/loginHistoryService');
const { success, error } = require('../utils/response');

exports.recordLogin = async (req, res, next) => {
  try {
    console.log('[LoginHistory] recordLogin: user=', req.user?.id);
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';
    const userAgent = req.body?.user_agent || '';

    const record = await loginHistoryService.logLogin(req.user.id, ipAddress, userAgent);
    console.log('[LoginHistory] recordLogin success:', record?.id);
    return success(res, record, 'Login tercatat', null, 201);
  } catch (err) {
    console.error('[LoginHistory] recordLogin error:', err);
    next(err);
  }
};

exports.recordLogout = async (req, res, next) => {
  try {
    console.log('[LoginHistory] recordLogout: user=', req.user?.id);
    const record = await loginHistoryService.logLogout(req.user.id);
    console.log('[LoginHistory] recordLogout result:', record?.id);
    return success(res, record, 'Logout tercatat');
  } catch (err) {
    console.error('[LoginHistory] recordLogout error:', err);
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    console.log('[LoginHistory] list: user=', req.user?.id);
    const records = await loginHistoryService.listByUser(req.user.id);
    console.log('[LoginHistory] list count:', records?.length);
    return success(res, records, 'Riwayat login berhasil dimuat');
  } catch (err) {
    console.error('[LoginHistory] list error:', err);
    next(err);
  }
};
