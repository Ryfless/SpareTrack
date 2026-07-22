const { Router } = require('express');
const authRoutes = require('./auth');
const dashboardRoutes = require('./dashboard');
const inventoryRoutes = require('./inventory');
const branchesRoutes = require('./branches');
const transactionsRoutes = require('./transactions');
const restockRoutes = require('./restock');
const forecastRoutes = require('./forecast');
const reportsRoutes = require('./reports');
const settingsRoutes = require('./settings');
const referencesRoutes = require('./references');
const usersRoutes = require('./users');
const notificationRoutes = require('./notifications');
const auditLogRoutes = require('./auditLogs');

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/branches', branchesRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/restock', restockRoutes);
router.use('/forecast', forecastRoutes);
router.use('/reports', reportsRoutes);
router.use('/settings', settingsRoutes);
router.use('/', referencesRoutes);
router.use('/users', usersRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit-logs', auditLogRoutes);

module.exports = router;
