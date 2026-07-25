const { supabaseAdmin: supabase } = require('../config/supabase');

async function list() {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

async function getStocks(branchId, query) {
  const { search, category_id, status } = query;

  const { data: branch } = await supabase
    .from('branches')
    .select('*')
    .eq('id', branchId)
    .single();

  if (!branch) return null;

  let sparepartQuery = supabase
    .from('spareparts')
    .select('id, code, name, price, unit, categories(name)');

  if (search) {
    sparepartQuery = sparepartQuery.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
  }
  if (category_id) {
    sparepartQuery = sparepartQuery.eq('category_id', category_id);
  }

  const { data: spareparts, error: spError } = await sparepartQuery;
  if (spError) throw spError;

  const result = await Promise.all((spareparts || []).map(async (sp) => {
    const { data: stock } = await supabase
      .from('branch_stocks')
      .select('quantity, safety_stock, reorder_point, min_stock')
      .eq('sparepart_id', sp.id)
      .eq('branch_id', branchId)
      .maybeSingle();

    const qty = stock?.quantity || 0;
    const safetyStock = stock?.safety_stock || 0;
    const reorderPoint = stock?.reorder_point || 0;
    const minStock = stock?.min_stock || 0;
    let itemStatus = 'safe';
    if (qty <= safetyStock) itemStatus = 'critical';
    else if (qty <= reorderPoint) itemStatus = 'low';
    else if (qty >= minStock * 5) itemStatus = 'overstock';

    if (status && itemStatus !== status) return null;

    return {
      id: sp.id,
      code: sp.code,
      name: sp.name,
      price: sp.price,
      unit: sp.unit,
      category: sp.categories?.name || '',
      quantity: qty,
      reorder_point: reorderPoint,
      safety_stock: safetyStock,
      status: itemStatus,
    };
  }));

  return {
    branch,
    stocks: result.filter(Boolean),
  };
}

module.exports = { list, getStocks };
