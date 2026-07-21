const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const errorHandler = require('./middlewares/errorHandler');
const apiRoutes = require('./routes/index');
const { authenticate } = require('./middlewares/auth');
const { me } = require('./controllers/authController');

const app = express();

app.use(helmet());
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1', apiRoutes);
app.get('/api/v1/me', authenticate, me);

app.use(errorHandler);

module.exports = app;
