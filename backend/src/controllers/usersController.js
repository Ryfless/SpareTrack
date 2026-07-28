const usersService = require('../services/usersService');
const { success, error } = require('../utils/response');

exports.list = async (req, res, next) => {
  try {
    const result = await usersService.list(req.query);
    return success(res, result.data, 'OK', result.meta);
  } catch (err) {
    next(err);
  }
};

exports.detail = async (req, res, next) => {
  try {
    const data = await usersService.detail(req.params.id);
    if (!data) return error(res, 'User tidak ditemukan', null, 404);
    return success(res, data, 'OK');
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = await usersService.create(req.body);
    return success(res, data, 'User berhasil dibuat', null, 201);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const data = await usersService.update(req.params.id, req.body);
    if (!data) return error(res, 'User tidak ditemukan', null, 404);
    return success(res, data, 'User berhasil diperbarui');
  } catch (err) {
    next(err);
  }
};

exports.toggleActive = async (req, res, next) => {
  try {
    const data = await usersService.toggleActive(req.params.id);
    if (!data) return error(res, 'User tidak ditemukan', null, 404);
    const msg = data.is_active ? 'User berhasil diaktifkan' : 'User berhasil dinonaktifkan';
    return success(res, data, msg);
  } catch (err) {
    next(err);
  }
};
