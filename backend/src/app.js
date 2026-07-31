const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const errorHandler = require('./middlewares/errorHandler');
const apiRoutes = require('./routes/index');
const { authenticate } = require('./middlewares/auth');
const { me, updateProfile } = require('./controllers/authController');

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || config.allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, false);
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', commit: process.env.GIT_SHA || 'local', timestamp: new Date().toISOString() });
});

app.use('/api/v1', apiRoutes);
app.get('/api/v1/me', authenticate, me);
app.patch('/api/v1/me', authenticate, updateProfile);

app.use(errorHandler);

module.exports = app;
