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
    .select('*, spareparts!inner(code, name), branches!inner(name), profiles(full_name)', { count: 'exact' });

  if (type) qry = qry.eq('type', type);
  if (branch_id) qry = qry.eq('branch_id', branch_id);
  if (sparepart_id) qry = qry.eq('sparepart_id', sparepart_id);
  if (start_date) qry = qry.gte('created_at', start_date);
  if (end_date) qry = qry.lte('created_at', end_date);

  const sortColumn = ['created_at', 'type', 'quantity', 'reference_id'].includes(sort_by) ? sort_by : 'created_at';
  qry = qry.order(sortColumn, { ascending: order === 'asc' });

  const { data, count, error } = await qry.range(offset, offset + Number(limit) - 1);
  if (error) throw error;

  return {
    data: (data || []).map(m => ({
      id: m.id,
      type: m.type,
      quantity: m.quantity,
      notes: m.notes,
      reference_id: m.reference_id,
      sparepart_id: m.sparepart_id,
      sparepart_code: m.spareparts?.code || '',
      sparepart_name: m.spareparts?.name || '',
      branch_id: m.branch_id,
      branch_name: m.branches?.name || '',
      created_by: m.profiles?.full_name || '',
      created_at: m.created_at,
    })),
    meta: {
      page: Number(page),
      limit: Number(limit),
      total: count || 0,
      total_pages: Math.ceil((count || 0) / Number(limit)),
    },
  };
}

async function create(data) {
  const { type, sparepart_id, branch_id, quantity, notes, reference_id, created_by, destination_branch_id } = data;

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

  if (type === 'transfer' && destination_branch_id) {
    if (branch_id === destination_branch_id) {
      const err = new Error('Cabang asal dan tujuan tidak boleh sama');
      err.status = 400;
      throw err;
    }

    const { data: destBranch } = await supabase
      .from('branches')
      .select('id')
      .eq('id', destination_branch_id)
      .single();

    if (!destBranch) {
      const err = new Error('Cabang tujuan tidak ditemukan');
      err.status = 404;
      throw err;
    }

    const { data: outMovement, error: outErr } = await supabase
      .from('stock_movements')
      .insert({ type: 'out', sparepart_id, branch_id, quantity: qty, notes: notes || `Transfer ke ${destination_branch_id}`, reference_id: reference_id || '', created_by })
      .select()
      .single();

    if (outErr) throw outErr;

    const { data: inMovement, error: inErr } = await supabase
      .from('stock_movements')
      .insert({ type: 'in', sparepart_id, branch_id: destination_branch_id, quantity: qty, notes: notes || `Transfer dari ${branch_id}`, reference_id: reference_id || '', created_by })
      .select()
      .single();

    if (inErr) throw inErr;

    await supabase.from('activities').insert({
      user_id: created_by,
      branch_id,
      action: 'transfer',
      entity_type: 'stock_movement',
      entity_id: outMovement.id,
      description: `Transfer ${qty}× sparepart ke cabang tujuan (${notes || ''})`,
    });

    return { out: outMovement, in: inMovement };
  }

  const movementData = {
    type,
    sparepart_id,
    branch_id,
    quantity: type === 'adjustment' ? Number(quantity) : qty,
    notes: notes || '',
    reference_id: reference_id || '',
    created_by,
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
    description: `${activityText[type] || ''}${notes || ''}`,
  });

  return movement;
}

module.exports = { list, create };
