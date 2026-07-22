const { Router } = require('express');
const { list, markRead, markAllRead, unreadCount } = require('../controllers/notificationController');
const { authenticate } = require('../middlewares/auth');

const router = Router();

router.get('/', authenticate, list);
router.patch('/read-all', authenticate, markAllRead);
router.get('/unread-count', authenticate, unreadCount);
router.patch('/:id/read', authenticate, markRead);

module.exports = router;
