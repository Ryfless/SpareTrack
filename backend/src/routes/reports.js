const { Router } = require('express');
const { summary } = require('../controllers/reportsController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

router.get('/summary', authenticate, authorize('super_admin'), summary);

module.exports = router;
