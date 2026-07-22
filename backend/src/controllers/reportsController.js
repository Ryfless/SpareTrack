const reportsService = require('../services/reportsService');
const { success, error } = require('../utils/response');

exports.summary = async (req, res, next) => {
  try {
    const data = await reportsService.summary(req.query);
    return success(res, data, 'OK');
  } catch (err) {
    next(err);
  }
};

exports.exportPdf = async (req, res, next) => {
  try {
    const { type, start_date, end_date, branch_id } = req.query;
    if (!type || !start_date || !end_date) {
      return error(res, 'Parameter type, start_date, dan end_date wajib diisi', null, 400);
    }
    const buffer = await reportsService.exportPdf(type, start_date, end_date, branch_id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="laporan-${type}-${Date.now()}.pdf"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

exports.exportExcel = async (req, res, next) => {
  try {
    const { type, start_date, end_date, branch_id } = req.query;
    if (!type || !start_date || !end_date) {
      return error(res, 'Parameter type, start_date, dan end_date wajib diisi', null, 400);
    }
    const buffer = await reportsService.exportExcel(type, start_date, end_date, branch_id);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="laporan-${type}-${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};
