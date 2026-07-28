const { Router } = require('express');
const {
  register,
  login,
  requestOtp,
  verifyOtp,
  googleAuth,
  logout,
} = require('../controllers/authController');
const {
  recordLogin,
  recordLogout,
  list: listLoginHistory,
} = require('../controllers/loginHistoryController');
const { authenticate } = require('../middlewares/auth');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/otp/request', requestOtp);
router.post('/otp/verify', verifyOtp);
router.post('/google', googleAuth);
router.post('/logout', authenticate, logout);

router.post('/login-history/login', authenticate, recordLogin);
router.post('/login-history/logout', authenticate, recordLogout);
router.get('/login-history', authenticate, listLoginHistory);

module.exports = router;
