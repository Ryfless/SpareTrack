const { supabaseAdmin: supabase } = require('../config/supabase');
const { sendNotificationToRole } = require('./notificationService');

const URGENCY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, overstock: 4 };

async function generate(userId) {
  const { data: spareparts } = await supabase
    .from('spareparts')
    .select('id, name, code, min_stock, reorder_point, safety_stock')
    .eq('is_active', true);

  if (!spareparts || spareparts.length === 0) return [];

  const { data: branches } = await supabase.from('branches').select('id, name').eq('is_active', true);
  if (!branches) return [];

  const results = [];

  for (const sp of spareparts) {
    for (const br of branches) {
      const { data: stock } = await supabase
        .from('branch_stocks')
        .select('quantity')
        .eq('sparepart_id', sp.id)
        .eq('branch_id', br.id)
        .maybeSingle();

      const currentStock = stock?.quantity ?? 0;

      const { data: movements } = await supabase
        .from('stock_movements')
        .select('type, quantity')
        .eq('sparepart_id', sp.id)
        .eq('branch_id', br.id)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

      const outQty = movements
        ?.filter(m => m.type === 'out')
        .reduce((s, m) => s + Math.abs(m.quantity), 0) || 0;
      const monthlyConsumption = Math.max(outQty / 3, 1);
      const daysToStockout = currentStock > 0 ? Math.round(currentStock / (monthlyConsumption / 30)) : 0;

      let urgency = 'medium';
      let recommendedQty = 0;

      if (currentStock <= sp.safety_stock) {
        urgency = 'critical';
        recommendedQty = sp.reorder_point * 2 - currentStock;
      } else if (currentStock <= sp.reorder_point) {
        urgency = 'high';
        recommendedQty = sp.reorder_point * 2 - currentStock;
      } else if (currentStock <= sp.reorder_point * 1.5) {
        urgency = 'medium';
        recommendedQty = sp.reorder_point - currentStock;
      } else if (currentStock >= sp.min_stock * 5) {
        urgency = 'overstock';
        recommendedQty = 0;
      } else {
        urgency = 'low';
        recommendedQty = 0;
      }

      recommendedQty = Math.max(recommendedQty, 0);

      const notesParts = [];
      if (urgency === 'critical') notesParts.push('Stok di bawah safety stock — perlu restock segera');
      else if (urgency === 'high') notesParts.push('Stok di bawah reorder point');
      else if (urgency === 'overstock') notesParts.push('Stok melebihi batas maksimum — pertimbangkan transfer atau promosi');
      else if (urgency === 'medium') notesParts.push('Stok mulai menipis');

      if (daysToStockout > 0 && urgency !== 'overstock') {
        notesParts.push(`Estimasi habis dalam ${daysToStockout} hari (konsumsi ${Math.round(monthlyConsumption)}/bln)`);
      }

      const { data: existing } = await supabase
        .from('restock_recommendations')
        .select('id')
        .eq('sparepart_id', sp.id)
        .eq('branch_id', br.id)
        .maybeSingle();

      if (existing) {
        const { data: updated } = await supabase
          .from('restock_recommendations')
          .update({
            current_stock: currentStock,
            reorder_point: sp.reorder_point,
            recommended_qty: recommendedQty,
            urgency,
            status: 'pending',
            notes: notesParts.join('. '),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (updated) results.push(updated);
      } else {
        const { data: inserted } = await supabase
          .from('restock_recommendations')
          .insert({
            sparepart_id: sp.id,
            branch_id: br.id,
            current_stock: currentStock,
            reorder_point: sp.reorder_point,
            recommended_qty: recommendedQty,
            urgency,
            notes: notesParts.join('. '),
          })
          .select()
          .single();
        if (inserted) results.push(inserted);
      }
    }
  }

  await supabase.from('activities').insert({
    user_id: userId,
    action: 'generate_restock',
    entity_type: 'restock_recommendation',
    description: `Generate rekomendasi restock untuk ${spareparts.length} sparepart x ${branches.length} cabang`,
  });

  const criticalCount = results.filter(r => r.urgency === 'critical').length;
  if (criticalCount > 0) {
    await sendNotificationToRole(
      'super_admin',
      'Stok Kritis Terdeteksi',
      `Generate restock menemukan ${criticalCount} item dengan status kritis — perlu tindakan segera`,
      'warning',
      '/restock',
    );
  }

  return results;
}

async function summary() {
  const { data: all } = await supabase
    .from('restock_recommendations')
    .select('urgency, status');

  const byUrgency = { critical: 0, high: 0, medium: 0, low: 0, overstock: 0 };
  const byStatus = { pending: 0, approved: 0, rejected: 0, ordered: 0 };

  for (const r of all || []) {
    if (byUrgency[r.urgency] !== undefined) byUrgency[r.urgency]++;
    if (byStatus[r.status] !== undefined) byStatus[r.status]++;
  }

  const { data: criticalItems } = await supabase
    .from('restock_recommendations')
    .select('*, spareparts(name, code), branches(name)')
    .eq('urgency', 'critical')
    .eq('status', 'pending')
    .limit(5);

  const { data: poStats } = await supabase
    .from('purchase_orders')
    .select('status');

  const poByStatus = { draft: 0, pending: 0, approved: 0, received: 0, cancelled: 0 };
  for (const p of poStats || []) {
    if (poByStatus[p.status] !== undefined) poByStatus[p.status]++;
  }

  return {
    total_recommendations: (all || []).length,
    by_urgency: byUrgency,
    by_status: byStatus,
    critical_items: (criticalItems || []).map(c => ({
      id: c.id,
      sparepart_name: c.spareparts?.name || '',
      code: c.spareparts?.code || '',
      branch_name: c.branches?.name || '',
      current_stock: c.current_stock,
      recommended_qty: c.recommended_qty,
    })),
    purchase_orders: { by_status: poByStatus },
  };
}

async function recommendations(query) {
  const { branch_id, status, urgency, limit = 50 } = query;

  let qry = supabase
    .from('restock_recommendations')
    .select('*, spareparts!inner(code, name, price, unit, min_stock, lead_time), branches!inner(name)')
    .order('urgency', { ascending: true });

  if (branch_id) qry = qry.eq('branch_id', branch_id);
  if (status) qry = qry.eq('status', status);
  if (urgency) qry = qry.eq('urgency', urgency);

  const { data, error } = await qry.limit(Number(limit));
  if (error) throw error;

  const sorted = (data || [])
    .map(r => ({
      id: r.id,
      sparepart_id: r.sparepart_id,
      code: r.spareparts?.code || '',
      name: r.spareparts?.name || '',
      price: r.spareparts?.price || 0,
      unit: r.spareparts?.unit || 'pcs',
      min_stock: r.spareparts?.min_stock || 0,
      lead_time: r.spareparts?.lead_time || 0,
      branch_id: r.branch_id,
      branch_name: r.branches?.name || '',
      current_stock: r.current_stock,
      reorder_point: r.reorder_point,
      recommended_qty: r.recommended_qty,
      urgency: r.urgency,
      status: r.status,
      notes: r.notes,
      days_to_stockout: r.current_stock > 0
        ? Math.round(r.current_stock / Math.max(r.recommended_qty / 30, 1))
        : 0,
      created_at: r.created_at,
    }))
    .sort((a, b) => (URGENCY_ORDER[a.urgency] || 99) - (URGENCY_ORDER[b.urgency] || 99));

  return sorted;
}

async function detailRecommendation(id) {
  const { data: r, error } = await supabase
    .from('restock_recommendations')
    .select('*, spareparts!inner(*, categories(name), suppliers(name)), branches!inner(*)')
    .eq('id', id)
    .single();

  if (error || !r) return null;

  return {
    id: r.id,
    sparepart_id: r.sparepart_id,
    code: r.spareparts?.code || '',
    name: r.spareparts?.name || '',
    price: r.spareparts?.price || 0,
    unit: r.spareparts?.unit || 'pcs',
    min_stock: r.spareparts?.min_stock || 0,
    lead_time: r.spareparts?.lead_time || 0,
    category: r.spareparts?.categories?.name || '',
    supplier: r.spareparts?.suppliers?.name || '',
    branch_id: r.branch_id,
    branch_name: r.branches?.name || '',
    current_stock: r.current_stock,
    reorder_point: r.reorder_point,
    recommended_qty: r.recommended_qty,
    urgency: r.urgency,
    status: r.status,
    notes: r.notes,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

async function approveRecommendation(id, userId, ip_address = '') {
  const { data: rec, error: findError } = await supabase
    .from('restock_recommendations')
    .select('*')
    .eq('id', id)
    .single();

  if (findError || !rec) return null;

  const { data, error } = await supabase
    .from('restock_recommendations')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await supabase.from('activities').insert({
    user_id: userId,
    action: 'approve_restock',
    entity_type: 'restock_recommendation',
    entity_id: id,
    description: `Menyetujui rekomendasi restock ${rec.id}`,
  });

  await supabase.from('audit_logs').insert({
    user_id: userId,
    action: 'approve_restock',
    entity_type: 'restock_recommendation',
    entity_id: id,
    old_data: { status: rec.status },
    new_data: { status: 'approved' },
    ip_address,
  });

  return data;
}

async function rejectRecommendation(id, userId, ip_address = '') {
  const { data: rec, error: findError } = await supabase
    .from('restock_recommendations')
    .select('*')
    .eq('id', id)
    .single();

  if (findError || !rec) return null;

  const { data, error } = await supabase
    .from('restock_recommendations')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await supabase.from('activities').insert({
    user_id: userId,
    action: 'reject_restock',
    entity_type: 'restock_recommendation',
    entity_id: id,
    description: `Menolak rekomendasi restock ${rec.id}`,
  });

  await supabase.from('audit_logs').insert({
    user_id: userId,
    action: 'reject_restock',
    entity_type: 'restock_recommendation',
    entity_id: id,
    old_data: { status: rec.status },
    new_data: { status: 'rejected' },
    ip_address,
  });

  return data;
}

async function purchaseOrders(query) {
  const { page = 1, limit = 20, status, branch_id } = query;
  const offset = (Number(page) - 1) * Number(limit);

  let qry = supabase
    .from('purchase_orders')
    .select('*, suppliers(name), branches(name)', { count: 'exact' });

  if (status) qry = qry.eq('status', status);
  if (branch_id) qry = qry.eq('branch_id', branch_id);

  qry = qry.order('created_at', { ascending: false });

  const { data, count, error } = await qry.range(offset, offset + Number(limit) - 1);
  if (error) throw error;

  return {
    data: (data || []).map(po => ({
      id: po.id,
      po_number: po.po_number,
      supplier: po.suppliers?.name || '',
      branch: po.branches?.name || '',
      status: po.status,
      total_amount: po.total_amount,
      notes: po.notes,
      created_at: po.created_at,
      approved_at: po.approved_at,
      received_at: po.received_at,
    })),
    meta: {
      page: Number(page),
      limit: Number(limit),
      total: count || 0,
      total_pages: Math.ceil((count || 0) / Number(limit)),
    },
  };
}

async function createPurchaseOrder(data) {
  const { supplier_id, branch_id, notes, items, requested_by, recommendation_id } = data;

  if (!supplier_id || !branch_id) {
    const err = new Error('supplier_id dan branch_id wajib diisi');
    err.status = 400;
    throw err;
  }

  const poCount = await supabase
    .from('purchase_orders')
    .select('id', { count: 'exact', head: true });

  const poNumber = `PO-${String((poCount.count || 0) + 1).padStart(4, '0')}`;

  const { data: po, error } = await supabase
    .from('purchase_orders')
    .insert({
      po_number: poNumber,
      supplier_id,
      branch_id,
      status: 'pending',
      notes: notes || '',
      requested_by,
    })
    .select()
    .single();

  if (error) throw error;

  if (items && items.length > 0) {
    const poItems = items.map(item => ({
      purchase_order_id: po.id,
      sparepart_id: item.sparepart_id,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unit_price) || 0,
      total_price: (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    }));

    const { error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(poItems);

    if (itemsError) throw itemsError;

    const totalAmount = poItems.reduce((sum, i) => sum + i.total_price, 0);
    await supabase
      .from('purchase_orders')
      .update({ total_amount: totalAmount })
      .eq('id', po.id);
  }

  if (recommendation_id) {
    await supabase
      .from('restock_recommendations')
      .update({ status: 'ordered', updated_at: new Date().toISOString() })
      .eq('id', recommendation_id);
  }

  await supabase.from('activities').insert({
    user_id: requested_by,
    branch_id,
    action: 'create_po',
    entity_type: 'purchase_order',
    entity_id: po.id,
    description: `Membuat PO ${poNumber}`,
  });

  return po;
}

async function purchaseOrderDetail(poId) {
  const { data: po, error } = await supabase
    .from('purchase_orders')
    .select('*, suppliers(name), branches(name), purchase_order_items(*, spareparts(name, code, unit))')
    .eq('id', poId)
    .single();

  if (error || !po) return null;

  return {
    id: po.id,
    po_number: po.po_number,
    supplier: po.suppliers?.name || '',
    branch: po.branches?.name || '',
    status: po.status,
    total_amount: po.total_amount,
    notes: po.notes,
    requested_by: po.requested_by,
    approved_at: po.approved_at,
    received_at: po.received_at,
    created_at: po.created_at,
    items: (po.purchase_order_items || []).map(i => ({
      id: i.id,
      sparepart_id: i.sparepart_id,
      code: i.spareparts?.code || '',
      name: i.spareparts?.name || '',
      unit: i.spareparts?.unit || '',
      quantity: i.quantity,
      unit_price: i.unit_price,
      total_price: i.total_price,
      received_qty: i.received_qty,
    })),
  };
}

async function approvePurchaseOrder(poId, userId, ip_address = '') {
  const { data: po, error } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('id', poId)
    .single();

  if (error || !po) return null;
  if (po.status !== 'pending') {
    const err = new Error('PO sudah diproses sebelumnya');
    err.status = 400;
    throw err;
  }

  await supabase
    .from('purchase_orders')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', poId);

  await supabase.from('activities').insert({
    user_id: userId,
    branch_id: po.branch_id,
    action: 'approve_po',
    entity_type: 'purchase_order',
    entity_id: poId,
    description: `Menyetujui PO ${po.po_number}`,
  });

  await supabase.from('audit_logs').insert({
    user_id: userId,
    action: 'approve_po',
    entity_type: 'purchase_order',
    entity_id: poId,
    old_data: { status: 'pending' },
    new_data: { status: 'approved' },
    ip_address,
  });

  try {
    const { sendNotification } = require('./notificationService');
    await sendNotification(po.requested_by, 'PO Disetujui',
      `PO ${po.po_number} telah disetujui — menunggu penerimaan barang`,
      'success', '/restock');
  } catch {}

  return { id: poId, status: 'approved' };
}

async function receivePurchaseOrder(poId, userId, ip_address = '') {
  const { data: po, error } = await supabase
    .from('purchase_orders')
    .select('*, purchase_order_items(*, spareparts(name, code))')
    .eq('id', poId)
    .single();

  if (error || !po) return null;
  if (po.status !== 'approved') {
    const err = new Error('PO harus berstatus approved untuk diterima');
    err.status = 400;
    throw err;
  }

  const items = po.purchase_order_items || [];

  for (const item of items) {
    const qty = Number(item.quantity);
    if (qty <= 0) continue;

    const { data: existing } = await supabase
      .from('branch_stocks')
      .select('id, quantity')
      .eq('sparepart_id', item.sparepart_id)
      .eq('branch_id', po.branch_id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('branch_stocks')
        .update({ quantity: existing.quantity + qty })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('branch_stocks')
        .insert({ sparepart_id: item.sparepart_id, branch_id: po.branch_id, quantity: qty });
    }

    await supabase
      .from('stock_movements')
      .insert({
        type: 'in',
        sparepart_id: item.sparepart_id,
        branch_id: po.branch_id,
        quantity: qty,
        notes: `PO ${po.po_number} — ${item.spareparts?.name || ''}`,
        created_by: userId,
      });

    await supabase
      .from('purchase_order_items')
      .update({ received_qty: qty })
      .eq('id', item.id);
  }

  if (!po.total_amount || po.total_amount === 0) {
    const total = items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unit_price), 0);
    await supabase.from('purchase_orders').update({ total_amount: total }).eq('id', poId);
  }

  await supabase
    .from('purchase_orders')
    .update({ status: 'received', received_at: new Date().toISOString() })
    .eq('id', poId);

  await supabase.from('activities').insert({
    user_id: userId,
    branch_id: po.branch_id,
    action: 'receive_po',
    entity_type: 'purchase_order',
    entity_id: poId,
    description: `Menerima PO ${po.po_number} — ${items.length} item masuk stok`,
  });

  await supabase.from('audit_logs').insert({
    user_id: userId,
    action: 'receive_po',
    entity_type: 'purchase_order',
    entity_id: poId,
    old_data: { status: 'approved' },
    new_data: { status: 'received', received_at: new Date().toISOString() },
    ip_address,
  });

  try {
    const { sendNotification } = require('./notificationService');
    await sendNotification(po.requested_by, 'PO Diterima',
      `PO ${po.po_number} telah diterima — ${items.length} item masuk stok`,
      'success', '/restock');
  } catch {}

  return { id: poId, status: 'received', items_processed: items.length };
}

async function cancelPurchaseOrder(poId, userId, ip_address = '') {
  const { data: po, error } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('id', poId)
    .single();

  if (error || !po) return null;
  if (po.status !== 'pending') {
    const err = new Error('Hanya PO dengan status pending yang dapat dibatalkan');
    err.status = 400;
    throw err;
  }

  await supabase
    .from('purchase_orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', poId);

  if (po.recommendation_id) {
    await supabase
      .from('restock_recommendations')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', po.recommendation_id);
  }

  await supabase.from('activities').insert({
    user_id: userId,
    branch_id: po.branch_id,
    action: 'cancel_po',
    entity_type: 'purchase_order',
    entity_id: poId,
    description: `Membatalkan PO ${po.po_number}`,
  });

  await supabase.from('audit_logs').insert({
    user_id: userId,
    action: 'cancel_po',
    entity_type: 'purchase_order',
    entity_id: poId,
    old_data: { status: 'pending' },
    new_data: { status: 'cancelled' },
    ip_address,
  });

  return { id: poId, status: 'cancelled' };
}

module.exports = {
  generate, summary, recommendations, detailRecommendation,
  approveRecommendation, rejectRecommendation,
  purchaseOrders, createPurchaseOrder,
  purchaseOrderDetail, approvePurchaseOrder, receivePurchaseOrder,
  cancelPurchaseOrder,
};
