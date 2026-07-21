const { Router } = require('express');
const { list, create } = require('../controllers/transactionsController');
const { authenticate } = require('../middlewares/auth');

const router = Router();

router.get('/', authenticate, list);
router.post('/', authenticate, create);

module.exports = router;
