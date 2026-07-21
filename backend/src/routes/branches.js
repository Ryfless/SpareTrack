const { Router } = require('express');
const { list, getStocks } = require('../controllers/branchesController');
const { authenticate } = require('../middlewares/auth');

const router = Router();

router.get('/', authenticate, list);
router.get('/:id/stocks', authenticate, getStocks);

module.exports = router;
