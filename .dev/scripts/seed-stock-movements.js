require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start, end) {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  d.setHours(randomInt(7, 17), randomInt(0, 59), randomInt(0, 59), 0);
  return d.toISOString();
}

function generateTrfRef() {
  const digits = String(randomInt(0, 9999999999999)).padStart(13, '0');
  return `TRF-${digits}`;
}

const NOTES_IN = [
  (sn, cn) => `Pembelian ${sn} untuk ${cn}`,
  (sn, cn) => `Restock ${sn} - ${cn}`,
  (sn, cn) => `Pengadaan ${sn} dari supplier`,
  (sn, cn) => `Stock masuk ${sn} untuk ${cn}`,
];

const NOTES_OUT = [
  (sn, cn) => `Penggunaan ${sn} - service ${cn}`,
  (sn, cn) => `Pemakaian ${sn} untuk perbaikan`,
  (sn, cn) => `Pengeluaran ${sn} - ${cn}`,
  (sn, cn) => `Klaim ${sn} untuk ${cn}`,
];

const NOTES_TRF = [
  (sn, bn, dn) => `Transfer ${sn} dari ${bn} ke ${dn}`,
  (sn, bn, dn) => `Mutasi ${sn} dari ${bn} ke ${dn}`,
  (sn, bn, dn) => `Pengiriman ${sn} ${bn} -> ${dn}`,
];

async function getPgClient() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  return client;
}

async function main() {
  console.log('=== SpareTrack - Seed Stock Movements ===\n');

  console.log('Fetching reference data...');
  const { data: spareparts, error: se } = await supabaseAdmin.from('spareparts').select('id, name, code');
  if (se) throw new Error(`spareparts: ${se.message}`);
  console.log(`  spareparts: ${spareparts.length}`);

  const { data: branches, error: be } = await supabaseAdmin.from('branches').select('id, name, code');
  if (be) throw new Error(`branches: ${be.message}`);
  console.log(`  branches: ${branches.length}`);

  const { data: profiles, error: pe } = await supabaseAdmin.from('profiles').select('id');
  if (pe) throw new Error(`profiles: ${pe.message}`);
  console.log(`  profiles: ${profiles.length}`);

  if (!spareparts.length || !branches.length || !profiles.length) {
    throw new Error('Missing reference data');
  }

  const TOTAL = 200;
  const records = [];
  const usedParts = new Set();

  const INFRA_RATIO = 0.40;
  const OUT_RATIO = 0.35;

  for (let i = 0; i < TOTAL; i++) {
    const rand = Math.random();
    let type = rand < INFRA_RATIO ? 'in' : rand < INFRA_RATIO + OUT_RATIO ? 'out' : 'transfer';

    let sparepart;
    if (i < spareparts.length && !usedParts.has(spareparts[i].id)) {
      sparepart = spareparts[i];
    } else {
      sparepart = randomItem(spareparts);
    }
    usedParts.add(sparepart.id);

    const branch = randomItem(branches);
    const profile = randomItem(profiles);
    const date = randomDate(new Date('2026-01-01T00:00:00Z'), new Date('2026-07-25T23:59:59Z'));
    const quantity = randomInt(1, 50);
    const sn = sparepart.name;

    let record = {
      sparepart_id: sparepart.id,
      branch_id: branch.id,
      type,
      quantity,
      reference_id: '',
      notes: '',
      created_by: profile.id,
      created_at: date,
    };

    if (type === 'in') {
      record.notes = randomItem(NOTES_IN)(sn, branch.name);
    } else if (type === 'out') {
      record.notes = randomItem(NOTES_OUT)(sn, branch.name);
    } else {
      let destBranch = randomItem(branches);
      while (destBranch.id === branch.id) {
        destBranch = randomItem(branches);
      }
      record.notes = randomItem(NOTES_TRF)(sn, branch.name, destBranch.name);
      record.reference_id = generateTrfRef();
      record.destination_branch_id = destBranch.id;
    }

    records.push(record);
  }

  for (const p of spareparts) {
    if (usedParts.has(p.id)) continue;
    const branch = randomItem(branches);
    const profile = randomItem(profiles);
    const date = randomDate(new Date('2026-01-01T00:00:00Z'), new Date('2026-07-25T23:59:59Z'));
    records.push({
      sparepart_id: p.id,
      branch_id: branch.id,
      type: 'in',
      quantity: randomInt(1, 50),
      reference_id: '',
      notes: randomItem(NOTES_IN)(p.name, branch.name),
      created_by: profile.id,
      created_at: date,
    });
  }

  console.log(`\nGenerated ${records.length} records total`);
  const typeCounts = {};
  for (const r of records) {
    typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
  }
  console.log('  Type distribution:', typeCounts);

  const trfCount = records.filter(r => r.type === 'transfer').length;
  console.log(`  Transfer records with reference_id: ${trfCount}`);

  const allPartIds = new Set(records.map(r => r.sparepart_id));
  console.log(`  Unique spareparts covered: ${allPartIds.size}/${spareparts.length}`);

  console.log('\nConnecting to database to disable trigger...');
  const pg = await getPgClient();

  try {
    await pg.query('ALTER TABLE public.stock_movements DISABLE TRIGGER update_stock_on_movement;');
    console.log('  Trigger disabled successfully.');
  } catch (err) {
    console.warn('  Warning: Could not disable trigger:', err.message);
    console.log('  Proceeding anyway...');
  }

  await pg.end();

  console.log('\nInserting records into stock_movements...');
  const BATCH_SIZE = 25;
  let inserted = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error: insertErr } = await supabaseAdmin.from('stock_movements').insert(batch);
    if (insertErr) {
      console.error(`  Error batch ${i / BATCH_SIZE + 1}: ${insertErr.message}`);
    } else {
      inserted += batch.length;
      console.log(`  Batch ${i / BATCH_SIZE + 1} OK (${inserted}/${records.length})`);
    }
  }

  console.log('\nRe-enabling trigger...');
  const pg2 = await getPgClient();
  try {
    await pg2.query('ALTER TABLE public.stock_movements ENABLE TRIGGER update_stock_on_movement;');
    console.log('  Trigger enabled successfully.');
  } catch (err) {
    console.warn('  Warning: Could not enable trigger:', err.message);
  }
  await pg2.end();

  console.log(`\n=== Done! Inserted ${inserted}/${records.length} records ===`);
}

main().catch(err => {
  console.error('\nScript failed:', err);
  process.exit(1);
});
