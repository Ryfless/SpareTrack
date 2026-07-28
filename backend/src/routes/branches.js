const { Router } = require('express');
const { list, getStocks, salesTrend } = require('../controllers/branchesController');
const { authenticate } = require('../middlewares/auth');

const router = Router();

router.get('/', authenticate, list);
router.get('/sales-trend', authenticate, salesTrend);
router.get('/:id/stocks', authenticate, getStocks);

module.exports = router;
