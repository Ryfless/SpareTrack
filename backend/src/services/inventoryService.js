const { stringify } = require('csv-stringify/sync');
const { supabaseAdmin: supabase } = require('../config/supabase');
const { sendNotification, sendNotificationToBranch } = require('./notificationService');
const { computeStatus, computeWorstStatus } = require('../utils/stockStatus');

async function computeStatusCounts(branchId) {
  let sparepartIds;
  if (branchId) {
    const { data: bs } = await supabase
      .from('branch_stocks')
      .select('sparepart_id')
      .eq('branch_id', branchId);
    sparepartIds = [...new Set((bs || []).map(b => b.sparepart_id))];
    if (sparepartIds.length === 0) {
      return { total: 0, safe: 0, low: 0, critical: 0, overstock: 0 };
    }
  }

  let qry = supabase.from('spareparts').select('id').eq('is_active', true);
  if (branchId) qry = qry.in('id', sparepartIds);

  const { data: spareparts } = await qry;

  if (!spareparts || spareparts.length === 0) {
    return { total: 0, safe: 0, low: 0, critical: 0, overstock: 0 };
  }

  const counts = { total: spareparts.length, safe: 0, low: 0, critical: 0, overstock: 0 };

  await Promise.all(spareparts.map(async (sp) => {
    let stockQry = supabase
      .from('branch_stocks')
      .select('quantity, safety_stock, reorder_point, max_stock, min_stock')
      .eq('sparepart_id', sp.id);
    if (branchId) stockQry = stockQry.eq('branch_id', branchId);
    const { data: stocks } = await stockQry;

    if (!stocks || stocks.length === 0) { counts.safe++; return; }

    const statuses = stocks.map(s => computeStatus(s.quantity, s.safety_stock, s.reorder_point, s.max_stock));
    counts[computeWorstStatus(statuses)]++;
  }));

  return counts;
}

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

  const overallCounts = await computeStatusCounts(branch_id || undefined);

  if (status) {
    const { data: spareparts, error } = await qry;
    if (error) throw error;

    let enriched = await Promise.all((spareparts || []).map(async (sp) => {
      let stockQry = supabase
        .from('branch_stocks')
        .select('quantity, reorder_point, max_stock, branches!inner(id, name)');

      if (branch_id) {
        stockQry = stockQry.eq('branch_id', branch_id);
      }

      const { data: stocks } = await stockQry.eq('sparepart_id', sp.id);

      const totalStock = stocks?.reduce((sum, s) => sum + s.quantity, 0) || 0;
      const stockByBranch = stocks?.map(s => ({
        branch_id: s.branches.id,
        branch_name: s.branches.name,
        quantity: s.quantity,
        reorder_point: s.reorder_point || 0,
        max_stock: s.max_stock || 0,
      })) || [];

      let bsQry = supabase
        .from('branch_stocks')
        .select('quantity, safety_stock, reorder_point, max_stock, min_stock')
        .eq('sparepart_id', sp.id);
      if (branch_id) bsQry = bsQry.eq('branch_id', branch_id);
      const { data: branchStocks } = await bsQry;

      const statuses = (branchStocks || []).map(bs => computeStatus(bs.quantity, bs.safety_stock, bs.reorder_point, bs.max_stock));
      let itemStatus = computeWorstStatus(statuses);

      if (itemStatus !== status) return null;

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

    const total = enriched.length;
    const paged = enriched.slice(offset, offset + Number(limit));

    return {
      data: paged,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        total_pages: Math.ceil(total / Number(limit)),
        counts: overallCounts,
      },
    };
  }

  const needsInMemorySort = sort_by === 'status' || sort_by === 'supplier' || sort_by === 'category';

  let spareparts, count, error;
  if (needsInMemorySort) {
    ({ data: spareparts, count, error } = await qry);
  } else {
    ({ data: spareparts, count, error } = await qry.range(offset, offset + Number(limit) - 1));
  }
  if (error) throw error;

  let enriched = await Promise.all((spareparts || []).map(async (sp) => {
    let stockQry = supabase
      .from('branch_stocks')
      .select('quantity, reorder_point, max_stock, branches!inner(id, name)');

    if (branch_id) {
      stockQry = stockQry.eq('branch_id', branch_id);
    }

    const { data: stocks } = await stockQry.eq('sparepart_id', sp.id);

    const totalStock = stocks?.reduce((sum, s) => sum + s.quantity, 0) || 0;
    const stockByBranch = stocks?.map(s => ({
      branch_id: s.branches.id,
      branch_name: s.branches.name,
      quantity: s.quantity,
      reorder_point: s.reorder_point || 0,
      max_stock: s.max_stock || 0,
    })) || [];

    let bsQry = supabase
      .from('branch_stocks')
      .select('quantity, safety_stock, reorder_point, max_stock, min_stock')
      .eq('sparepart_id', sp.id);
    if (branch_id) bsQry = bsQry.eq('branch_id', branch_id);
    const { data: branchStocks } = await bsQry;

    const statuses = (branchStocks || []).map(bs => computeStatus(bs.quantity, bs.safety_stock, bs.reorder_point, bs.max_stock));
    let itemStatus = computeWorstStatus(statuses);

    return {
      ...sp,
      category: sp.categories?.name || '',
      supplier: sp.suppliers?.name || '',
      total_stock: totalStock,
      stock_by_branch: stockByBranch,
      status: itemStatus,
    };
  }));

  if (needsInMemorySort) {
    const dir = order === 'desc' ? -1 : 1;
    enriched.sort((a, b) => {
      const va = (a[sort_by] || '').toLowerCase();
      const vb = (b[sort_by] || '').toLowerCase();
      return va < vb ? -dir : va > vb ? dir : 0;
    });
    enriched = enriched.slice(offset, offset + Number(limit));
  }

  return {
    data: enriched,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total: count || 0,
      total_pages: Math.ceil((count || 0) / Number(limit)),
      counts: overallCounts,
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

  const { data: movements } = await supabase
    .from('stock_movements')
    .select('*, profiles(full_name)')
    .eq('sparepart_id', id)
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: branchStocks } = await supabase
    .from('branch_stocks')
    .select('quantity, safety_stock, reorder_point, max_stock, min_stock, branches(id, name)')
    .eq('sparepart_id', id);

  let itemStatus = 'safe';
  let stockByBranch = [];
  let totalStock = 0;
  for (const s of branchStocks || []) {
    totalStock += s.quantity || 0;
    stockByBranch.push({
      branch_id: s.branches?.id || '',
      branch_name: s.branches?.name || '',
      quantity: s.quantity || 0,
      safety_stock: s.safety_stock || 0,
      reorder_point: s.reorder_point || 0,
      max_stock: s.max_stock || 0,
      min_stock: s.min_stock || 0,
    });
    itemStatus = computeWorstStatus([itemStatus, computeStatus(s.quantity, s.safety_stock, s.reorder_point, s.max_stock)]);
  }

  return {
    ...sparepart,
    category: sparepart.categories?.name || '',
    supplier: sparepart.suppliers?.name || '',
    total_stock: totalStock,
    stock_by_branch: stockByBranch,
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
  const { code, name, category_id, supplier_id, price, lead_time, unit } = data;

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
      lead_time: lead_time || 3,
      unit: unit || 'pcs',
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

async function update(id, data, userId, ip_address = '') {
  const { data: existing } = await supabase
    .from('spareparts')
    .select('*')
    .eq('id', id)
    .single();

  if (!existing) return null;

  if (data.category_id) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('id', data.category_id)
      .single();
    if (!cat) {
      const err = new Error('Kategori tidak ditemukan');
      err.status = 400;
      throw err;
    }
  }

  if (data.supplier_id) {
    const { data: sup } = await supabase
      .from('suppliers')
      .select('id')
      .eq('id', data.supplier_id)
      .single();
    if (!sup) {
      const err = new Error('Supplier tidak ditemukan');
      err.status = 400;
      throw err;
    }
  }

  const updates = {};
  const allowed = ['name', 'category_id', 'supplier_id', 'price', 'lead_time', 'unit', 'is_active'];
  for (const key of allowed) {
    if (data[key] !== undefined) updates[key] = data[key];
  }
  updates.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from('spareparts')
    .update(updates)
    .eq('id', id)
    .select('*, categories(name), suppliers(name)')
    .single();

  if (error) throw error;

  if (userId) {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'update',
      entity_type: 'sparepart',
      entity_id: id,
      old_data: existing,
      new_data: updated,
      ip_address,
    });
  }

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

async function exportCsv(query, res) {
  const { search, category_id, supplier_id, status } = query;

  let qry = supabase
    .from('spareparts')
    .select('*, categories(name), suppliers(name)');

  if (search) qry = qry.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
  if (category_id) qry = qry.eq('category_id', category_id);
  if (supplier_id) qry = qry.eq('supplier_id', supplier_id);

  const { data: spareparts } = await qry;
  if (!spareparts || spareparts.length === 0) {
    const err = new Error('Tidak ada data sparepart');
    err.status = 404;
    throw err;
  }

  const enriched = [];
  for (const sp of spareparts) {
    const { data: stocks } = await supabase
      .from('branch_stocks')
      .select('quantity, safety_stock, reorder_point, max_stock, min_stock')
      .eq('sparepart_id', sp.id);

    const statuses = (stocks || []).map(s => computeStatus(s.quantity, s.safety_stock, s.reorder_point, s.max_stock));
    let itemStatus = computeWorstStatus(statuses);
    const totalStock = stocks?.reduce((s, st) => s + (st.quantity || 0), 0) || 0;

    if (status && itemStatus !== status) continue;

    enriched.push({
      code: sp.code,
      name: sp.name,
      category: sp.categories?.name || '',
      supplier: sp.suppliers?.name || '',
      price: sp.price,
      total_stock: totalStock,
      status: itemStatus,
    });
  }

  const csvString = stringify(enriched, {
    header: true,
    columns: [
      { key: 'code', header: 'Kode' },
      { key: 'name', header: 'Nama' },
      { key: 'category', header: 'Kategori' },
      { key: 'supplier', header: 'Supplier' },
      { key: 'price', header: 'Harga' },
      { key: 'total_stock', header: 'Total Stok' },
      { key: 'status', header: 'Status' },
    ],
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="inventory-export-${Date.now()}.csv"`);
  res.send(csvString);
}

async function bulkTransfer(data, userId, userRole) {
  const { items, source_branch_id, destination_branch_id, notes } = data;

  if (!items || !Array.isArray(items) || items.length === 0) {
    const err = new Error('items wajib diisi (array of { sparepart_id, quantity })');
    err.status = 400;
    throw err;
  }

  if (!source_branch_id || !destination_branch_id) {
    const err = new Error('source_branch_id dan destination_branch_id wajib diisi');
    err.status = 400;
    throw err;
  }

  if (source_branch_id === destination_branch_id) {
    const err = new Error('Cabang asal dan tujuan tidak boleh sama');
    err.status = 400;
    throw err;
  }

  const { data: sourceBranch } = await supabase
    .from('branches')
    .select('id, name')
    .eq('id', source_branch_id)
    .single();
  if (!sourceBranch) {
    const err = new Error('Cabang asal tidak ditemukan');
    err.status = 404;
    throw err;
  }

  if (userRole === 'branch_admin') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('branch')
      .eq('id', userId)
      .maybeSingle();
    if (profile?.branch) {
      const { data: userBranch } = await supabase
        .from('branches')
        .select('id')
        .or(`id.eq.${profile.branch},name.eq.${profile.branch}`)
        .maybeSingle();
      if (!userBranch || userBranch.id !== source_branch_id) {
        const err = new Error('Anda hanya dapat mentransfer dari cabang Anda sendiri');
        err.status = 403;
        throw err;
      }
    }
  }

  const { data: destBranch } = await supabase
    .from('branches')
    .select('id, name')
    .eq('id', destination_branch_id)
    .single();
  if (!destBranch) {
    const err = new Error('Cabang tujuan tidak ditemukan');
    err.status = 404;
    throw err;
  }

  for (const item of items) {
    if (!item.sparepart_id || !item.quantity) {
      const err = new Error('Setiap item harus memiliki sparepart_id dan quantity');
      err.status = 400;
      throw err;
    }
  }

  const { data: spareparts } = await supabase
    .from('spareparts')
    .select('id, name, code')
    .in('id', items.map(i => i.sparepart_id));

  const sparepartMap = {};
  for (const sp of spareparts || []) {
    sparepartMap[sp.id] = sp;
  }

  const results = [];

  for (const item of items) {
    const sp = sparepartMap[item.sparepart_id];
    if (!sp) {
      const err = new Error(`Sparepart ${item.sparepart_id} tidak ditemukan`);
      err.status = 404;
      throw err;
    }

    const qty = Math.abs(Number(item.quantity));
    if (qty <= 0) {
      const err = new Error(`Quantity untuk ${sp.code} harus lebih dari 0`);
      err.status = 400;
      throw err;
    }

    const { data: stock } = await supabase
      .from('branch_stocks')
      .select('quantity')
      .eq('sparepart_id', item.sparepart_id)
      .eq('branch_id', source_branch_id)
      .maybeSingle();

    const currentStock = stock?.quantity || 0;
    if (currentStock < qty) {
      const err = new Error(`Stok ${sp.code} di ${sourceBranch.name} tidak mencukupi (tersedia: ${currentStock}, diminta: ${qty})`);
      err.status = 400;
      throw err;
    }
  }

  for (const item of items) {
    const sp = sparepartMap[item.sparepart_id];
    const qty = Math.abs(Number(item.quantity));

    const { data: movement, error: movErr } = await supabase
      .from('stock_movements')
      .insert({
        type: 'transfer', sparepart_id: item.sparepart_id,
        branch_id: source_branch_id, destination_branch_id,
        quantity: qty, notes: notes || `Transfer bulk ke ${destBranch.name}`,
        created_by: userId,
      })
      .select()
      .single();

    if (movErr) throw movErr;

    results.push({
      sparepart_id: sp.id,
      code: sp.code,
      name: sp.name,
      quantity: qty,
      movement_id: movement.id,
    });
  }

  await supabase.from('activities').insert({
    user_id: userId,
    branch_id: source_branch_id,
    action: 'bulk_transfer',
    entity_type: 'stock_movement',
    description: `Transfer bulk ${results.length} item dari ${sourceBranch.name} ke ${destBranch.name}`,
  });

  await sendNotification(userId, 'Transfer Stok Selesai',
    `${results.length} item berhasil ditransfer dari ${sourceBranch.name} ke ${destBranch.name}`,
    'success', '/inventory');
  await sendNotificationToBranch(destBranch.id, 'Transfer Stok Masuk',
    `${results.length} item diterima dari ${sourceBranch.name}`,
    'info', '/inventory');

  return {
    source_branch: sourceBranch.name,
    destination_branch: destBranch.name,
    items_transferred: results.length,
    items: results,
  };
}

module.exports = { list, detail, create, update, adjustStock, exportCsv, bulkTransfer, computeStatusCounts };
