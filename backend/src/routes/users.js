const { Router } = require('express');
const {
  list, detail, create, update, toggleActive,
} = require('../controllers/usersController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

router.get('/', authenticate, authorize('super_admin'), list);
router.get('/:id', authenticate, authorize('super_admin'), detail);
router.post('/', authenticate, authorize('super_admin'), create);
router.patch('/:id', authenticate, authorize('super_admin'), update);
router.patch('/:id/toggle', authenticate, authorize('super_admin'), toggleActive);

module.exports = router;
