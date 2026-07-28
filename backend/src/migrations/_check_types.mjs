import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
const { rows } = await client.query(
  `SELECT column_name, data_type FROM information_schema.columns
   WHERE table_name = 'branch_stocks'
   AND column_name IN ('safety_stock','reorder_point','eoq','max_stock','min_stock')
   ORDER BY column_name`
);
rows.forEach(r => console.log(r.column_name, '->', r.data_type));
await client.end();
