const { Router } = require('express');
const { list, detail } = require('../controllers/auditLogController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

router.get('/', authenticate, authorize('super_admin'), list);
router.get('/:id', authenticate, authorize('super_admin'), detail);

module.exports = router;
