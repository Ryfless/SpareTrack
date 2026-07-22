const cron = require('node-cron');
const { supabaseAdmin: supabase } = require('../config/supabase');
const config = require('../config');
const restockService = require('./restockService');

let scheduledTask = null;
let jobStatus = {
  active: false,
  cron_expression: null,
  last_run: null,
  last_status: null,
  last_error: null,
};

async function findSystemUserId() {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'super_admin')
    .limit(1)
    .maybeSingle();
  return data?.id || null;
}

async function executeRestockGeneration() {
  const userId = await findSystemUserId();
  if (!userId) {
    console.warn('[Scheduler] No super_admin found, skipping generate');
    jobStatus.last_status = 'skipped';
    jobStatus.last_error = 'No super_admin user found';
    return;
  }

  try {
    const results = await restockService.generate(userId);
    jobStatus.last_run = new Date().toISOString();
    jobStatus.last_status = 'success';
    jobStatus.last_error = null;

    const criticalCount = (results || []).filter(r => r.urgency === 'critical').length;

    await supabase.from('activities').insert({
      user_id: userId,
      action: 'scheduler_restock',
      entity_type: 'restock_recommendation',
      description: `[Scheduler] Generate otomatis: ${results.length} rekomendasi (${criticalCount} critical)`,
    });

    console.log(`[Scheduler] Generate completed: ${results.length} recommendations, ${criticalCount} critical`);
  } catch (err) {
    jobStatus.last_status = 'failed';
    jobStatus.last_error = err.message;
    console.error('[Scheduler] Generate failed:', err.message);
  }
}

function startScheduler() {
  const cronExpression = config.restockCronSchedule;

  if (scheduledTask) {
    scheduledTask.stop();
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const forceScheduler = process.env.FORCE_SCHEDULER === 'true';

  jobStatus.cron_expression = cronExpression;

  if (!isProduction && !forceScheduler) {
    console.log('[Scheduler] Skipped (not production, set FORCE_SCHEDULER=true to override)');
    jobStatus.active = false;
    return;
  }

  if (!cron.validate(cronExpression)) {
    console.warn(`[Scheduler] Invalid cron expression: ${cronExpression}, scheduler disabled`);
    jobStatus.active = false;
    return;
  }

  scheduledTask = cron.schedule(cronExpression, () => {
    executeRestockGeneration();
  });

  jobStatus.active = true;

  console.log(`[Scheduler] Started with cron: ${cronExpression}`);
}

function getStatus() {
  return { ...jobStatus };
}

async function triggerManual() {
  await executeRestockGeneration();
  return { ...jobStatus };
}

function stopScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }
  jobStatus.active = false;
}

module.exports = {
  startScheduler,
  stopScheduler,
  getStatus,
  triggerManual,
};
