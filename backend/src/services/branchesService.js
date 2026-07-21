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
    .select('id, code, name, price, min_stock, reorder_point, safety_stock, unit, categories(name)');

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
      .select('quantity')
      .eq('sparepart_id', sp.id)
      .eq('branch_id', branchId)
      .maybeSingle();

    const qty = stock?.quantity || 0;
    let itemStatus = 'safe';
    if (qty <= sp.safety_stock) itemStatus = 'critical';
    else if (qty <= sp.reorder_point) itemStatus = 'low';
    else if (qty >= sp.min_stock * 5) itemStatus = 'overstock';

    if (status && itemStatus !== status) return null;

    return {
      id: sp.id,
      code: sp.code,
      name: sp.name,
      price: sp.price,
      unit: sp.unit,
      category: sp.categories?.name || '',
      quantity: qty,
      min_stock: sp.min_stock,
      reorder_point: sp.reorder_point,
      safety_stock: sp.safety_stock,
      status: itemStatus,
    };
  }));

  return {
    branch,
    stocks: result.filter(Boolean),
  };
}

module.exports = { list, getStocks };
