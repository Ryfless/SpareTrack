const app = require('./app');
const config = require('./config');
const scheduler = require('./services/schedulerService');

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  scheduler.startScheduler();
});
