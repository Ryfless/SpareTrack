const { supabaseAdmin: supabase } = require('../config/supabase');

async function list(query) {
  const {
    page = 1,
    limit = 20,
    search,
    category_id,
    supplier_id,
    branch_id,
    status,
    is_active,
    sort_by = 'name',
    order = 'asc',
  } = query;

  const offset = (Number(page) - 1) * Number(limit);

  let qry = supabase
    .from('spareparts')
    .select('*, categories(name), suppliers(name)', { count: 'exact' });

  if (search) {
    qry = qry.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
  }
  if (category_id) {
    qry = qry.eq('category_id', category_id);
  }
  if (supplier_id) {
    qry = qry.eq('supplier_id', supplier_id);
  }
  if (is_active !== undefined) {
    const active = is_active === 'true' || is_active === true;
    qry = qry.eq('is_active', active);
  }

  const sortColumn = ['name', 'code', 'price', 'created_at'].includes(sort_by) ? sort_by : 'name';
  if (['name', 'code', 'price', 'created_at'].includes(sort_by)) {
    qry = qry.order(sortColumn, { ascending: order === 'asc' });
  }

  const { data: spareparts, count, error } = await qry.range(offset, offset + Number(limit) - 1);
  if (error) throw error;

  let enriched = await Promise.all((spareparts || []).map(async (sp) => {
    let stockQry = supabase
      .from('branch_stocks')
      .select('quantity, branches!inner(id, name)');

    if (branch_id) {
      stockQry = stockQry.eq('branch_id', branch_id);
    }

    const { data: stocks } = await stockQry.eq('sparepart_id', sp.id);

    const totalStock = stocks?.reduce((sum, s) => sum + s.quantity, 0) || 0;
    const stockByBranch = stocks?.map(s => ({
      branch_id: s.branches.id,
      branch_name: s.branches.name,
      quantity: s.quantity,
    })) || [];

    const overstockThreshold = sp.max_stock ?? sp.min_stock * 5;
    let itemStatus = 'safe';
    if (totalStock <= sp.safety_stock) itemStatus = 'critical';
    else if (totalStock <= sp.reorder_point) itemStatus = 'low';
    else if (totalStock >= overstockThreshold) itemStatus = 'overstock';

    if (status && itemStatus !== status) return null;

    return {
      ...sp,
      category: sp.categories?.name || '',
      supplier: sp.suppliers?.name || '',
      total_stock: totalStock,
      stock_by_branch: stockByBranch,
      status: itemStatus,
    };
  }));

  enriched = enriched.filter(Boolean);

  if (sort_by === 'status' || sort_by === 'supplier' || sort_by === 'category') {
    const dir = order === 'desc' ? -1 : 1;
    enriched.sort((a, b) => {
      const va = (a[sort_by] || '').toLowerCase();
      const vb = (b[sort_by] || '').toLowerCase();
      return va < vb ? -dir : va > vb ? dir : 0;
    });
  }

  return {
    data: enriched,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total: count || 0,
      total_pages: Math.ceil((count || 0) / Number(limit)),
    },
  };
}

async function detail(id) {
  const { data: sparepart, error } = await supabase
    .from('spareparts')
    .select('*, categories(*), suppliers(*)')
    .eq('id', id)
    .single();

  if (error) return null;

  const { data: stocks } = await supabase
    .from('branch_stocks')
    .select('quantity, branches(id, name)')
    .eq('sparepart_id', id);

  const { data: movements } = await supabase
    .from('stock_movements')
    .select('*, profiles(full_name)')
    .eq('sparepart_id', id)
    .order('created_at', { ascending: false })
    .limit(20);

  const totalStock = stocks?.reduce((sum, s) => sum + s.quantity, 0) || 0;

  const overstockThreshold = sparepart.max_stock ?? sparepart.min_stock * 5;
  let itemStatus = 'safe';
  if (totalStock <= sparepart.safety_stock) itemStatus = 'critical';
  else if (totalStock <= sparepart.reorder_point) itemStatus = 'low';
  else if (totalStock >= overstockThreshold) itemStatus = 'overstock';

  return {
    ...sparepart,
    category: sparepart.categories?.name || '',
    supplier: sparepart.suppliers?.name || '',
    total_stock: totalStock,
    stock_by_branch: stocks?.map(s => ({
      branch_id: s.branches.id,
      branch_name: s.branches.name,
      quantity: s.quantity,
    })) || [],
    status: itemStatus,
    recent_movements: movements?.map(m => ({
      id: m.id,
      type: m.type,
      quantity: m.quantity,
      notes: m.notes,
      created_by: m.profiles?.full_name || '',
      created_at: m.created_at,
    })) || [],
  };
}

async function create(data) {
  const { code, name, category_id, supplier_id, price, min_stock, reorder_point, safety_stock, lead_time, unit, max_stock } = data;

  if (!code || !name) {
    const err = new Error('code dan name wajib diisi');
    err.status = 400;
    throw err;
  }

  const { data: sparepart, error } = await supabase
    .from('spareparts')
    .insert({
      code, name,
      category_id: category_id || null,
      supplier_id: supplier_id || null,
      price: price || 0,
      min_stock: min_stock || 10,
      reorder_point: reorder_point || 20,
      safety_stock: safety_stock || 5,
      lead_time: lead_time || 3,
      unit: unit || 'pcs',
      max_stock: max_stock || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      const err = new Error('Kode sparepart sudah ada');
      err.status = 409;
      throw err;
    }
    throw error;
  }

  return sparepart;
}

async function update(id, data) {
  const { data: existing } = await supabase
    .from('spareparts')
    .select('id')
    .eq('id', id)
    .single();

  if (!existing) return null;

  const updates = {};
  const allowed = ['name', 'category_id', 'supplier_id', 'price', 'min_stock', 'max_stock', 'reorder_point', 'safety_stock', 'lead_time', 'unit', 'is_active'];
  for (const key of allowed) {
    if (data[key] !== undefined) updates[key] = data[key];
  }
  updates.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from('spareparts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return updated;
}

async function adjustStock(id, data, userId) {
  const { branch_id, quantity, notes } = data;

  const { data: sparepart } = await supabase
    .from('spareparts')
    .select('id, name')
    .eq('id', id)
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

  const { data: movement, error } = await supabase
    .from('stock_movements')
    .insert({
      type: 'adjustment',
      sparepart_id: id,
      branch_id,
      quantity: Number(quantity),
      notes: notes || '',
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from('activities').insert({
    user_id: userId,
    branch_id,
    action: 'adjustment',
    entity_type: 'stock_movement',
    entity_id: movement.id,
    description: `Penyesuaian stok: ${Number(quantity)} (${notes || 'tanpa catatan'})`,
  });

  return movement;
}

module.exports = { list, detail, create, update, adjustStock };
