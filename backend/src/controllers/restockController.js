const restockService = require('../services/restockService');
const schedulerService = require('../services/schedulerService');
const { success, error } = require('../utils/response');
const { getClientIp } = require('../utils/ip');
const { supabaseAdmin } = require('../config/supabase');

exports.generate = async (req, res, next) => {
  try {
    const data = await restockService.generate(req.user.id);
    return success(res, data, `${data.length} rekomendasi berhasil digenerate`, null, 201);
  } catch (err) {
    next(err);
  }
};

exports.liveRecommendations = async (req, res, next) => {
  try {
    const data = await restockService.getLiveRecommendations(req.query);
    return success(res, data, 'OK');
  } catch (err) {
    next(err);
  }
};
exports.summary = async (req, res, next) => {
  try {
    const data = await restockService.summary();
    return success(res, data, 'OK');
  } catch (err) {
    next(err);
  }
};

exports.recommendations = async (req, res, next) => {
  try {
    const data = await restockService.recommendations(req.query);
    return success(res, data, 'OK');
  } catch (err) {
    next(err);
  }
};

exports.detailRecommendation = async (req, res, next) => {
  try {
    const data = await restockService.detailRecommendation(req.params.id);
    if (!data) return error(res, 'Rekomendasi tidak ditemukan', null, 404);
    return success(res, data, 'OK');
  } catch (err) {
    next(err);
  }
};

exports.postponeRecommendation = async (req, res, next) => {
  try {
    const data = await restockService.postponeRecommendation(req.params.id, req.user.id, getClientIp(req), req.body.postpone_reason, req.body.postpone_until);
    if (!data) return error(res, 'Rekomendasi tidak ditemukan', null, 404);
    const msg = data.status === 'postponed' ? 'Rekomendasi ditunda' : 'Rekomendasi diaktifkan kembali';
    return success(res, data, msg);
  } catch (err) {
    next(err);
  }
};

exports.purchaseOrders = async (req, res, next) => {
  try {
    const result = await restockService.purchaseOrders(req.query);
    return success(res, result.data, 'OK', result.meta);
  } catch (err) {
    next(err);
  }
};

async function resolveBranch(userId) {
  const { data } = await supabaseAdmin.from('profiles').select('branch').eq('id', userId).maybeSingle();
  return data?.branch || null;
}

async function branchOwnsPO(userId, poId) {
  const branchName = await resolveBranch(userId);
  if (!branchName) return false;
  const { data: br } = await supabaseAdmin.from('branches').select('id').eq('name', branchName).maybeSingle();
  if (!br) return false;
  const { data: po } = await supabaseAdmin.from('purchase_orders').select('branch_id').eq('id', poId).maybeSingle();
  return po?.branch_id === br.id;
}

exports.createPurchaseOrder = async (req, res, next) => {
  try {
    if (req.userRole === 'branch_admin') {
      const branchName = await resolveBranch(req.user.id);
      if (!branchName) return error(res, 'Profil cabang tidak ditemukan', null, 403);
      const { data: br } = await supabaseAdmin.from('branches').select('id').eq('name', branchName).maybeSingle();
      if (!br || br.id !== req.body.branch_id) {
        return error(res, 'Anda hanya dapat membuat PO untuk cabang sendiri', null, 403);
      }
    }
    const data = await restockService.createPurchaseOrder({
      ...req.body,
      requested_by: req.user.id,
    });
    return success(res, data, 'Purchase order berhasil dibuat', null, 201);
  } catch (err) {
    next(err);
  }
};

exports.purchaseOrderDetail = async (req, res, next) => {
  try {
    const data = await restockService.purchaseOrderDetail(req.params.id);
    if (!data) return error(res, 'Purchase order tidak ditemukan', null, 404);
    return success(res, data, 'OK');
  } catch (err) {
    next(err);
  }
};

exports.approvePO = async (req, res, next) => {
  try {
    if (req.userRole === 'branch_admin') {
      const allowed = await branchOwnsPO(req.user.id, req.params.id);
      if (!allowed) return error(res, 'Anda hanya dapat mengelola PO cabang sendiri', null, 403);
    }
    const data = await restockService.approvePurchaseOrder(req.params.id, req.user.id, getClientIp(req));
    if (!data) return error(res, 'Purchase order tidak ditemukan', null, 404);
    return success(res, data, 'PO berhasil disetujui');
  } catch (err) {
    next(err);
  }
};

exports.cancelPO = async (req, res, next) => {
  try {
    if (req.userRole === 'branch_admin') {
      const allowed = await branchOwnsPO(req.user.id, req.params.id);
      if (!allowed) return error(res, 'Anda hanya dapat mengelola PO cabang sendiri', null, 403);
    }
    const data = await restockService.cancelPurchaseOrder(req.params.id, req.user.id, getClientIp(req));
    if (!data) return error(res, 'Purchase order tidak ditemukan', null, 404);
    return success(res, data, 'PO berhasil dibatalkan');
  } catch (err) {
    next(err);
  }
};

exports.receivePO = async (req, res, next) => {
  try {
    if (req.userRole === 'branch_admin') {
      const allowed = await branchOwnsPO(req.user.id, req.params.id);
      if (!allowed) return error(res, 'Anda hanya dapat mengelola PO cabang sendiri', null, 403);
    }
    const data = await restockService.receivePurchaseOrder(req.params.id, req.user.id, getClientIp(req));
    if (!data) return error(res, 'Purchase order tidak ditemukan', null, 404);
    return success(res, data, 'PO berhasil diterima, stok ditambahkan');
  } catch (err) {
    next(err);
  }
};

exports.schedulerStatus = async (req, res, next) => {
  try {
    const status = schedulerService.getStatus();
    return success(res, status, 'OK');
  } catch (err) {
    next(err);
  }
};

exports.triggerGenerate = async (req, res, next) => {
  try {
    const status = await schedulerService.triggerManual();
    return success(res, status, 'Generate selesai dijalankan');
  } catch (err) {
    next(err);
  }
};
