require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const queries = [
    `ALTER TABLE public.forecast_runs DROP CONSTRAINT IF EXISTS forecast_runs_method_check;`,
    `ALTER TABLE public.forecast_runs ADD CONSTRAINT forecast_runs_method_check CHECK (method IN ('moving_average','exponential_smoothing','linear_regression','xgboost'));`,
  ];

  for (const q of queries) {
    const { error } = await supabaseAdmin.rpc('exec_sql', { query: q });
    if (error) {
      console.log(`Executing via pg...`);
      const { Client } = require('pg');
      const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      await client.connect();
      await client.query(q);
      await client.end();
    }
  }
  console.log('Constraint updated: xgboost added to forecast_runs.method');
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
