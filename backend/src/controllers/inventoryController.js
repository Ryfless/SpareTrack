const inventoryService = require('../services/inventoryService');
const { success, error } = require('../utils/response');
const { getClientIp } = require('../utils/ip');

exports.list = async (req, res, next) => {
  try {
    const result = await inventoryService.list(req.query);
    return success(res, result.data, 'OK', result.meta);
  } catch (err) {
    next(err);
  }
};

exports.detail = async (req, res, next) => {
  try {
    const data = await inventoryService.detail(req.params.id);
    if (!data) return error(res, 'Sparepart tidak ditemukan', null, 404);
    return success(res, data, 'OK');
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = await inventoryService.create(req.body);
    return success(res, data, 'Sparepart berhasil dibuat', null, 201);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const data = await inventoryService.update(req.params.id, req.body, req.user?.id, getClientIp(req));
    if (!data) return error(res, 'Sparepart tidak ditemukan', null, 404);
    return success(res, data, 'Sparepart berhasil diupdate');
  } catch (err) {
    next(err);
  }
};

exports.adjustStock = async (req, res, next) => {
  try {
    const { branch_id, quantity, notes } = req.body;
    if (!branch_id || quantity === undefined) {
      return error(res, 'branch_id dan quantity wajib diisi', null, 400);
    }
    const data = await inventoryService.adjustStock(req.params.id, { branch_id, quantity, notes }, req.user.id);
    return success(res, data, 'Stok berhasil disesuaikan', null, 201);
  } catch (err) {
    next(err);
  }
};

exports.exportCsv = async (req, res, next) => {
  try {
    await inventoryService.exportCsv(req.query, res);
  } catch (err) {
    next(err);
  }
};

exports.bulkTransfer = async (req, res, next) => {
  try {
    const data = await inventoryService.bulkTransfer(req.body, req.user.id);
    return success(res, data, `${data.items_transferred} item berhasil ditransfer`, null, 201);
  } catch (err) {
    next(err);
  }
};
