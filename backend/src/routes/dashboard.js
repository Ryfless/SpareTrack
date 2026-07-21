const { Router } = require('express');
const { getSummary, getRecentActivity } = require('../controllers/dashboardController');
const { authenticate } = require('../middlewares/auth');

const router = Router();

router.get('/summary', authenticate, getSummary);
router.get('/recent-activity', authenticate, getRecentActivity);

module.exports = router;
