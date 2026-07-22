const { Router } = require('express');
const {
  generate, summary, recommendations, detailRecommendation,
  approveRecommendation, rejectRecommendation,
  purchaseOrders, createPurchaseOrder,
  purchaseOrderDetail, approvePO,
  schedulerStatus, triggerGenerate,
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
router.get('/purchase-orders/:id', authenticate, purchaseOrderDetail);
router.post('/purchase-orders/:id/approve', authenticate, authorize('super_admin'), approvePO);
router.get('/scheduler/status', authenticate, authorize('super_admin'), schedulerStatus);
router.post('/scheduler/trigger', authenticate, authorize('super_admin'), triggerGenerate);

module.exports = router;
