require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runMigration() {
  const projectRef = process.env.SUPABASE_URL?.match(/https:\/\/(.+)\.supabase\.co/)?.[1];
  if (!projectRef) {
    console.error('Could not extract project ref from SUPABASE_URL');
    process.exit(1);
  }

  const client = new Client({
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to Supabase Postgres');

    const sqlPath = path.join(__dirname, '001_core_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    await client.query(sql);
    console.log('Migration executed successfully');

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

runMigration();
