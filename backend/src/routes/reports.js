const { Router } = require('express');
const { summary, exportPdf, exportExcel } = require('../controllers/reportsController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

router.get('/summary', authenticate, authorize('super_admin'), summary);
router.get('/export/pdf', authenticate, authorize('super_admin'), exportPdf);
router.get('/export/excel', authenticate, authorize('super_admin'), exportExcel);

module.exports = router;
