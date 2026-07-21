const { Router } = require('express');
const { runs, runDetail, createRun, series } = require('../controllers/forecastController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

router.get('/runs', authenticate, runs);
router.get('/runs/:id', authenticate, runDetail);
router.post('/runs', authenticate, authorize('super_admin'), createRun);
router.get('/series', authenticate, series);

module.exports = router;
