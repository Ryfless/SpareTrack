const { Router } = require('express');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

router.get('/', authenticate, getSettings);
router.patch('/', authenticate, authorize('super_admin'), updateSettings);

module.exports = router;
