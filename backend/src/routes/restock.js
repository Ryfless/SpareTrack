const { Router } = require('express');
const {
  generate, summary, recommendations, detailRecommendation,
  approveRecommendation, rejectRecommendation,
  purchaseOrders, createPurchaseOrder,
} = require('../controllers/restockController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

router.post('/recommendations/generate', authenticate, authorize('super_admin'), generate);
router.get('/summary', authenticate, summary);
router.get('/recommendations', authenticate, recommendations);
router.get('/recommendations/:id', authenticate, detailRecommendation);
router.post('/recommendations/:id/approve', authenticate, authorize('super_admin'), approveRecommendation);
router.post('/recommendations/:id/reject', authenticate, authorize('super_admin'), rejectRecommendation);
router.get('/purchase-orders', authenticate, purchaseOrders);
router.post('/purchase-orders', authenticate, authorize('super_admin'), createPurchaseOrder);

module.exports = router;
