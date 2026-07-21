const { Router } = require('express');
const { list, detail, create, update, adjustStock } = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

router.get('/', authenticate, list);
router.get('/:id', authenticate, detail);
router.post('/', authenticate, authorize('super_admin'), create);
router.patch('/:id', authenticate, authorize('super_admin'), update);
router.post('/:id/stock', authenticate, adjustStock);

module.exports = router;
