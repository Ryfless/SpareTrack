const authService = require('../services/authService');
const { success, error } = require('../utils/response');

exports.register = async (req, res, next) => {
  try {
    const { email, password, fullName, phone, branch } = req.body;

    if (!email || !password || !fullName) {
      return error(res, 'Email, password, dan nama lengkap wajib diisi', null, 400);
    }

    const result = await authService.registerUser(email, password, {
      fullName,
      phone,
      branch,
    });

    return success(res, { user: result.user }, 'Registrasi berhasil', null, 201);
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, 'Email dan password wajib diisi', null, 400);
    }

    const result = await authService.loginUser(email, password);
    return success(res, result, 'Login berhasil');
  } catch (err) {
    next(err);
  }
};

exports.requestOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return error(res, 'Email wajib diisi', null, 400);
    }

    await authService.requestOtp(email);
    return success(res, null, 'Kode OTP telah dikirim ke email');
  } catch (err) {
    next(err);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return error(res, 'Email dan token OTP wajib diisi', null, 400);
    }

    const result = await authService.verifyOtp(email, token);
    return success(res, result, 'Verifikasi OTP berhasil');
  } catch (err) {
    next(err);
  }
};

exports.googleAuth = async (req, res, next) => {
  try {
    const result = await authService.signInWithGoogle();
    return success(res, result, 'Redirect ke Google OAuth');
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { supabaseAdmin } = require('../config/supabase');
    const { error: logoutError } = await supabaseAdmin.auth.admin.signOut(req.user.id);

    if (logoutError) throw logoutError;
    return success(res, null, 'Logout berhasil');
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    const profile = await authService.getProfile(req.user.id);
    return success(res, { user: req.user, profile }, 'OK');
  } catch (err) {
    next(err);
  }
};
