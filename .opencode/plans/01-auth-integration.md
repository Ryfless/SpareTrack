# Rencana Implementasi: Auth Integration (Backend + Frontend)

## Step 1: Fix .env & Install Backend Dependencies
1. Edit `backend/.env`: `SUPABASE_URL=https://vrjunoghbljooklvhvxw.supabase.co`
2. Edit `backend/package.json`: tambah `@supabase/supabase-js`, `helmet`, `morgan`, scripts `start`/`dev`
3. `npm install` di backend

## Step 2: Backend Foundation
Buat file-file berikut:

### `backend/src/config/supabase.js`
```js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
module.exports = { supabase, supabaseAdmin };
```

### `backend/src/config/index.js`
```js
require('dotenv').config();
module.exports = {
  port: process.env.PORT || 3001,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};
```

### `backend/src/utils/response.js`
```js
function success(res, data = null, message = 'OK', meta = null, status = 200) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}
function error(res, message = 'Internal Server Error', errors = null, status = 500) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(status).json(body);
}
module.exports = { success, error };
```

### `backend/src/middlewares/auth.js`
```js
const { supabase } = require('../config/supabase');
const { error } = require('../utils/response');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return error(res, 'Unauthorized', null, 401);
  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return error(res, 'Invalid or expired token', null, 401);
  req.user = user;
  req.accessToken = token;
  next();
}

function authorize(...roles) {
  return (req, res, next) => {
    const userRole = req.user?.app_metadata?.role || req.user?.user_metadata?.role || 'branch_admin';
    if (roles.length && !roles.includes(userRole)) return error(res, 'Forbidden: insufficient role', null, 403);
    req.userRole = userRole;
    next();
  };
}
module.exports = { authenticate, authorize };
```

### `backend/src/middlewares/errorHandler.js`
```js
const { error } = require('../utils/response');
function errorHandler(err, req, res, _next) {
  console.error('[ERROR]', err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  return error(res, message, null, status);
}
module.exports = errorHandler;
```

### `backend/src/app.js`
```js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/auth');

const app = express();
app.use(helmet());
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api/v1/auth', authRoutes);
app.use(errorHandler);
module.exports = app;
```

### `backend/src/server.js`
```js
const app = require('./app');
const config = require('./config');
app.listen(config.port, () => console.log(`Server running on port ${config.port}`));
```

## Step 3: Auth Backend Endpoints

### `backend/src/routes/auth.js`
```js
const { Router } = require('express');
const { register, login, requestOtp, verifyOtp, googleAuth, logout, me } = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const router = Router();
router.post('/register', register);
router.post('/login', login);
router.post('/otp/request', requestOtp);
router.post('/otp/verify', verifyOtp);
router.post('/google', googleAuth);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
module.exports = router;
```

### `backend/src/services/authService.js`
```js
const { supabase, supabaseAdmin } = require('../config/supabase');

async function registerUser(email, password, metadata) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email, password,
    email_confirm: true,
    user_metadata: { full_name: metadata.fullName, phone: metadata.phone, branch: metadata.branch, role: 'branch_admin' },
  });
  if (error) throw error;
  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user.id, email, full_name: metadata.fullName, phone: metadata.phone,
    branch: metadata.branch, role: 'branch_admin',
  });
  if (profileError) console.error('Profile insert error:', profileError);
  return data;
}

async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
  return { session: data.session, user: { ...data.user, profile } };
}

async function requestOtp(email) {
  const { data, error } = await supabase.auth.signInWithOtp({ email });
  if (error) throw error;
  return data;
}

async function verifyOtp(email, token) {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
  return data;
}

async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  if (error) throw error;
  return data;
}

async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) return null;
  return data;
}

module.exports = { registerUser, loginUser, requestOtp, verifyOtp, signInWithGoogle, getProfile };
```

### `backend/src/controllers/authController.js`
```js
const authService = require('../services/authService');
const { success, error } = require('../utils/response');

exports.register = async (req, res, next) => {
  try {
    const { email, password, fullName, phone, branch } = req.body;
    if (!email || !password || !fullName) return error(res, 'Email, password, dan nama wajib diisi', null, 400);
    const result = await authService.registerUser(email, password, { fullName, phone, branch });
    return success(res, { user: result.user }, 'Registrasi berhasil', null, 201);
  } catch (err) { return next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, 'Email dan password wajib diisi', null, 400);
    const result = await authService.loginUser(email, password);
    return success(res, result, 'Login berhasil');
  } catch (err) { return next(err); }
};

exports.requestOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return error(res, 'Email wajib diisi', null, 400);
    await authService.requestOtp(email);
    return success(res, null, 'Kode OTP telah dikirim ke email');
  } catch (err) { return next(err); }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, token } = req.body;
    if (!email || !token) return error(res, 'Email dan token OTP wajib diisi', null, 400);
    const result = await authService.verifyOtp(email, token);
    return success(res, result, 'Verifikasi OTP berhasil');
  } catch (err) { return next(err); }
};

exports.googleAuth = async (req, res, next) => {
  try {
    const result = await authService.signInWithGoogle();
    return success(res, result, 'Redirect ke Google OAuth');
  } catch (err) { return next(err); }
};

exports.logout = async (req, res, next) => {
  try {
    const { error: logoutError } = await require('../config/supabase').supabase.auth.admin.signOut(req.user.id);
    if (logoutError) throw logoutError;
    return success(res, null, 'Logout berhasil');
  } catch (err) { return next(err); }
};

exports.me = async (req, res, next) => {
  try {
    const profile = await authService.getProfile(req.user.id);
    return success(res, { user: req.user, profile }, 'OK');
  } catch (err) { return next(err); }
};
```

## Step 4: Frontend Service Layer

### Create `frontend/.env`:
```
VITE_SUPABASE_URL=https://vrjunoghbljooklvhvxw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:3001/api/v1
```

### `frontend/src/app/services/client.js`
Standardized fetch wrapper with auto token attachment from Supabase session.

### `frontend/src/app/services/auth.js`
Auth service functions: login, register, requestOtp, verifyOtp, logout, getMe.

## Step 5: Update Frontend Pages

- `LoginPage.tsx` → call `authService.login()`, handle loading/success/error
- `RegisterPage.tsx` → call `authService.register()`
- `ForgotPage.tsx` → call `authService.requestOtp()`
- `OTPPage.tsx` → call `authService.verifyOtp()`
- `App.tsx` → replace mock state with Supabase session, store user profile

## Step 6: Verify
1. Run `npm run dev` di backend
2. Run `npm run dev` di frontend
3. Test register → login → OTP → logout flow
