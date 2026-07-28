const { Router } = require('express');
const { getSummary, getRecentActivity, getDemandForecast } = require('../controllers/dashboardController');
const { authenticate } = require('../middlewares/auth');

const router = Router();

router.get('/summary', authenticate, getSummary);
router.get('/recent-activity', authenticate, getRecentActivity);
router.get('/demand-forecast', authenticate, getDemandForecast);

module.exports = router;
