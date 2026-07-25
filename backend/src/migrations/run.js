require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const MIGRATION_FILES = [
  '001_core_tables.sql',
  '003_restock_forecast_audit.sql',
  '004_indexes.sql',
  '005_max_stock.sql',
  '006_fix_overstock.sql',
  '007_theme_preference.sql',
  '008_transfer_destination.sql',
  '009_add_postponed_status.sql',
  '010_add_postpone_reason.sql',
  '011_add_postpone_until.sql',
  '012_branch_stocks_int.sql',
];

function getConnectionConfigs() {
  // 1. If DATABASE_URL is set, use it directly
  if (process.env.DATABASE_URL) {
    return [{ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }];
  }

  const projectRef = process.env.SUPABASE_URL?.match(/https:\/\/(.+)\.supabase\.co/)?.[1];
  if (!projectRef) throw new Error('Could not extract project ref from SUPABASE_URL');

  // 2. Try SUPABASE_DB_PASSWORD first, fall back to service role key
  const password = process.env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!password) throw new Error('Set SUPABASE_DB_PASSWORD or SUPABASE_SERVICE_ROLE_KEY in .env');

  // 3. If SUPABASE_DB_HOST is set, use it
  if (process.env.SUPABASE_DB_HOST) {
    return [{
      host: process.env.SUPABASE_DB_HOST,
      port: Number(process.env.SUPABASE_DB_PORT) || 5432,
      database: 'postgres',
      user: 'postgres',
      password,
      ssl: { rejectUnauthorized: false },
    }];
  }

  // 4. Try multiple hosts
  return [
    { host: `db.${projectRef}.supabase.co`,          port: 5432, user: 'postgres', password },
    { host: `aws-0-ap-southeast-1.pooler.supabase.com`, port: 6543, user: `postgres.${projectRef}`, password },
    { host: `aws-0-ap-southeast-2.pooler.supabase.com`, port: 6543, user: `postgres.${projectRef}`, password },
    { host: `aws-0-us-east-1.pooler.supabase.com`,      port: 6543, user: `postgres.${projectRef}`, password },
    { host: `aws-0-eu-west-1.pooler.supabase.com`,      port: 6543, user: `postgres.${projectRef}`, password },
  ].map(c => ({ ...c, database: 'postgres', ssl: { rejectUnauthorized: false } }));
}

async function tryConnect(configs) {
  let lastErr;
  for (const cfg of configs) {
    const client = new Client(cfg);
    try {
      await client.connect();
      console.log(`  ✅ Connected via ${cfg.connectionString ? 'DATABASE_URL' : `${cfg.host}:${cfg.port}`}`);
      return client;
    } catch (err) {
      lastErr = err;
      console.log(`  ⚠ ${cfg.host || 'DATABASE_URL'}: ${err.message}`);
    }
  }
  throw lastErr;
}

async function runMigration() {
  const configs = getConnectionConfigs();
  console.log('\nTrying database connections...\n');

  let client;
  try {
    client = await tryConnect(configs);
  } catch (_err) {
    console.error('\n✖ All connection attempts failed.');
    console.error('\nHow to fix:');
    console.error('  1. Go to https://supabase.com/dashboard/project/vrjunoghbljooklvhvxw/settings/database');
    console.error('  2. Copy the Connection string under "Direct connection"');
    console.error('  3. Add to backend/.env:');
    console.error('     DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@db.vrjunoghbljooklvhvxw.supabase.co:5432/postgres');
    console.error('\n  Or use the pooler (more reliable):');
    console.error('     DATABASE_URL=postgresql://postgres.vrjunoghbljooklvhvxw:YOUR_DB_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres');
    process.exit(1);
  }

  try {
    for (const file of MIGRATION_FILES) {
      const sqlPath = path.join(__dirname, file);
      if (!fs.existsSync(sqlPath)) {
        console.warn(`Skipping ${file} — not found`);
        continue;
      }

      const sql = fs.readFileSync(sqlPath, 'utf-8').trim();
      if (!sql) {
        console.log(`Skipping ${file} — empty`);
        continue;
      }

      console.log(`Running ${file}...`);
      await client.query(sql);
      console.log(`  ✅ ${file} executed`);
    }

    console.log('\nAll migrations completed successfully');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('\nMigration failed:', err.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

runMigration();
