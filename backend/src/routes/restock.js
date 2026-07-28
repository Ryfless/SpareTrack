const { Router } = require('express');
const {
  liveRecommendations, generate, summary, recommendations, detailRecommendation,
  postponeRecommendation,
  purchaseOrders, createPurchaseOrder,
  purchaseOrderDetail, approvePO, receivePO, cancelPO,
  schedulerStatus, triggerGenerate,
} = require('../controllers/restockController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

router.get('/live-recommendations', authenticate, liveRecommendations);
router.post('/recommendations/generate', authenticate, authorize('super_admin'), generate);
router.get('/summary', authenticate, summary);
router.get('/recommendations', authenticate, recommendations);
router.get('/recommendations/:id', authenticate, detailRecommendation);
router.post('/recommendations/:id/postpone', authenticate, postponeRecommendation);
router.get('/purchase-orders', authenticate, purchaseOrders);
router.post('/purchase-orders', authenticate, authorize('super_admin', 'branch_admin'), createPurchaseOrder);
router.get('/purchase-orders/:id', authenticate, purchaseOrderDetail);
router.post('/purchase-orders/:id/approve', authenticate, authorize('super_admin', 'branch_admin'), approvePO);
router.post('/purchase-orders/:id/receive', authenticate, authorize('super_admin', 'branch_admin'), receivePO);
router.delete('/purchase-orders/:id', authenticate, authorize('super_admin', 'branch_admin'), cancelPO);
router.get('/scheduler/status', authenticate, authorize('super_admin'), schedulerStatus);
router.post('/scheduler/trigger', authenticate, authorize('super_admin'), triggerGenerate);

module.exports = router;
