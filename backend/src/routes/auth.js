const { Router } = require('express');
const {
  register,
  login,
  requestOtp,
  verifyOtp,
  googleAuth,
  logout,
} = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/otp/request', requestOtp);
router.post('/otp/verify', verifyOtp);
router.post('/google', googleAuth);
router.post('/logout', authenticate, logout);

module.exports = router;
