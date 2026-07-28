const { supabaseAdmin: supabase } = require('../config/supabase');

async function list(query) {
  const {
    page = 1,
    limit = 20,
    type,
    branch_id,
    sparepart_id,
    start_date,
    end_date,
    sort_by = 'created_at',
    order = 'desc',
  } = query;

  const offset = (Number(page) - 1) * Number(limit);

  let qry = supabase
    .from('stock_movements')
    .select('*, spareparts!inner(code, name), branches!stock_movements_branch_id_fkey!inner(name), dest_branch:branches!stock_movements_destination_branch_id_fkey(name), profiles(full_name)', { count: 'exact' });

  if (type) qry = qry.eq('type', type);
  if (branch_id) qry = qry.eq('branch_id', branch_id);
  if (sparepart_id) qry = qry.eq('sparepart_id', sparepart_id);
  if (start_date) qry = qry.gte('created_at', start_date);
  if (end_date) qry = qry.lte('created_at', end_date);

  const sortColumn = ['created_at', 'type', 'quantity', 'reference_id'].includes(sort_by) ? sort_by : 'created_at';
  qry = qry.order(sortColumn, { ascending: order === 'asc' });

  const { data, count, error } = await qry.range(offset, offset + Number(limit) - 1);
  if (error) throw error;

  // Merge old out/in pairs into single transfer entries; show new single transfer records directly
  const movements = data || [];
  const merged = [];
  const paired = new Set();

  // First pass: collect single transfer records
  for (let i = 0; i < movements.length; i++) {
    const a = movements[i];
    if (a.type === 'transfer') {
      paired.add(i);
      merged.push({
        id: a.id,
        type: 'transfer',
        quantity: Math.abs(a.quantity),
        notes: a.notes || '',
        reference_id: a.reference_id || '',
        sparepart_id: a.sparepart_id,
        sparepart_code: a.spareparts?.code || '',
        sparepart_name: a.spareparts?.name || '',
        branch_id: a.branch_id,
        branch_name: a.branches?.name || '',
        destination_branch_id: a.destination_branch_id || '',
        destination_branch_name: a.dest_branch?.name || '',
        created_by: a.profiles?.full_name || '',
        created_at: a.created_at,
      });
    }
  }

  // Second pass: merge out/in pairs
  for (let i = 0; i < movements.length; i++) {
    if (paired.has(i)) continue;
    const a = movements[i];

    if (a.reference_id && (a.type === 'out' || a.type === 'in')) {
      const pairIdx = movements.findIndex((b, j) =>
        j > i && !paired.has(j) &&
        b.reference_id === a.reference_id &&
        b.sparepart_id === a.sparepart_id &&
        Math.abs(b.quantity) === Math.abs(a.quantity) &&
        b.type !== a.type
      );

      if (pairIdx !== -1) {
        paired.add(i);
        paired.add(pairIdx);
        const b = movements[pairIdx];
        const outM = a.type === 'out' ? a : b;
        const inM = a.type === 'in' ? a : b;
        merged.push({
          id: outM.id,
          type: 'transfer',
          quantity: Math.abs(outM.quantity),
          notes: outM.notes || inM.notes || '',
          reference_id: outM.reference_id || '',
          sparepart_id: outM.sparepart_id,
          sparepart_code: outM.spareparts?.code || '',
          sparepart_name: outM.spareparts?.name || '',
          branch_id: outM.branch_id,
          branch_name: outM.branches?.name || '',
          destination_branch_id: inM.branch_id || '',
          destination_branch_name: inM.branches?.name || '',
          created_by: outM.profiles?.full_name || '',
          created_at: outM.created_at,
        });
        continue;
      }
    }
    merged.push({
      id: a.id,
      type: a.type,
      quantity: a.quantity,
      notes: a.notes || '',
      reference_id: a.reference_id || '',
      sparepart_id: a.sparepart_id,
      sparepart_code: a.spareparts?.code || '',
      sparepart_name: a.spareparts?.name || '',
      branch_id: a.branch_id,
      branch_name: a.branches?.name || '',
      destination_branch_id: a.destination_branch_id || '',
      destination_branch_name: a.dest_branch?.name || '',
      created_by: a.profiles?.full_name || '',
      created_at: a.created_at,
    });
  }

  merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return {
    data: merged,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total: count || 0,
      total_pages: Math.ceil((count || 0) / Number(limit)),
    },
  };
}

async function create(data) {
  const { type, sparepart_id, branch_id, quantity, notes, reference_id, created_by, destination_branch_id, ip_address = '' } = data;

  const validTypes = ['in', 'out', 'transfer', 'adjustment'];
  if (!validTypes.includes(type)) {
    const err = new Error(`type harus salah satu dari: ${validTypes.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const { data: sparepart } = await supabase
    .from('spareparts')
    .select('id')
    .eq('id', sparepart_id)
    .single();

  if (!sparepart) {
    const err = new Error('Sparepart tidak ditemukan');
    err.status = 404;
    throw err;
  }

  const { data: branch } = await supabase
    .from('branches')
    .select('id')
    .eq('id', branch_id)
    .single();

  if (!branch) {
    const err = new Error('Cabang tidak ditemukan');
    err.status = 404;
    throw err;
  }

  const qty = Math.abs(Number(quantity));
  let finalNotes = notes || '';
  let finalRefId = reference_id || '';

  if (type === 'transfer' && destination_branch_id) {
    if (branch_id === destination_branch_id) {
      const err = new Error('Cabang asal dan tujuan tidak boleh sama');
      err.status = 400;
      throw err;
    }

    const { data: destBranch, error: destErr } = await supabase
      .from('branches')
      .select('id, name')
      .eq('id', destination_branch_id)
      .single();

    if (destErr || !destBranch) {
      const err = new Error('Cabang tujuan tidak ditemukan');
      err.status = 404;
      throw err;
    }

    if (!finalNotes) {
      const { data: sourceBranch } = await supabase
        .from('branches')
        .select('name')
        .eq('id', branch_id)
        .single();
      finalNotes = `Transfer dari ${sourceBranch?.name || 'Unknown'} ke ${destBranch.name}`;
    }

    if (!finalRefId) {
      finalRefId = `TRF-${Date.now()}`;
    }
  }

  const movementData = {
    type,
    sparepart_id,
    branch_id,
    quantity: type === 'adjustment' ? Number(quantity) : qty,
    notes: finalNotes,
    reference_id: finalRefId,
    created_by,
    ...(destination_branch_id && { destination_branch_id }),
  };

  const { data: movement, error } = await supabase
    .from('stock_movements')
    .insert(movementData)
    .select()
    .single();

  if (error) throw error;

  const activityText = {
    in: `Stok masuk: ${qty}× `,
    out: `Stok keluar: ${qty}× `,
    transfer: `Transfer: ${qty}× `,
    adjustment: `Penyesuaian: ${Number(quantity)} `,
  };

  await supabase.from('activities').insert({
    user_id: created_by,
    branch_id,
    action: type === 'transfer' || type === 'adjustment' ? type : type,
    entity_type: 'stock_movement',
    entity_id: movement.id,
    description: `${activityText[type] || ''}${finalNotes}`,
  });

  await supabase.from('audit_logs').insert({
    user_id: created_by,
    action: type,
    entity_type: 'stock_movement',
    entity_id: movement.id,
    old_data: {},
    new_data: { type, sparepart_id, branch_id, ...(destination_branch_id && { destination_branch_id }), quantity, notes: finalNotes },
    ip_address,
  });

  return movement;
}

module.exports = { list, create };
