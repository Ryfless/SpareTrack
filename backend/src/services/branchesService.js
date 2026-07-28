const { supabaseAdmin: supabase } = require('../config/supabase');
const { computeStatus } = require('../utils/stockStatus');

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
      .select('quantity, safety_stock, reorder_point, min_stock, max_stock')
      .eq('sparepart_id', sp.id)
      .eq('branch_id', branchId)
      .maybeSingle();

    const qty = stock?.quantity || 0;
    const safetyStock = stock?.safety_stock || 0;
    const reorderPoint = stock?.reorder_point || 0;
    const maxStock = stock?.max_stock || 0;
    const itemStatus = computeStatus(qty, safetyStock, reorderPoint, maxStock);

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

  const stocks = result.filter(Boolean);

  const totalValue = stocks.reduce((sum, s) => sum + s.quantity * s.price, 0);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const { data: monthlyData } = await supabase
    .from('stock_movements')
    .select('sparepart_id, quantity')
    .eq('type', 'out')
    .eq('branch_id', branchId)
    .gte('created_at', startOfMonth.toISOString())
    .lt('created_at', startOfNextMonth.toISOString());

  const monthlySales = (monthlyData || []).reduce((sum, m) => sum + m.quantity, 0);

  const grouped = {};
  for (const m of monthlyData || []) {
    grouped[m.sparepart_id] = (grouped[m.sparepart_id] || 0) + m.quantity;
  }
  const sorted = Object.entries(grouped)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  let topSelling = [];
  if (sorted.length > 0) {
    const spIds = sorted.map(([id]) => id);
    const { data: spData } = await supabase
      .from('spareparts')
      .select('id, name, code')
      .in('id', spIds);
    const spMap = Object.fromEntries((spData || []).map(s => [s.id, s]));
    topSelling = sorted.map(([id, total]) => ({
      sparepart_id: id,
      sparepart_name: spMap[id]?.name || 'Unknown',
      sparepart_code: spMap[id]?.code || '',
      total,
    }));
  }

  return {
    branch,
    stocks,
    total_value: totalValue,
    monthly_sales: monthlySales,
    top_selling: topSelling,
  };
}

async function getSalesTrend() {
  const { data: branches } = await supabase
    .from('branches')
    .select('id, name')
    .eq('is_active', true);

  const branchMap = Object.fromEntries((branches || []).map(b => [b.id, b.name]));

  const now = new Date();
  const startWindow = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const endWindow = new Date(now.getFullYear(), now.getMonth(), 1);

  const { data: movements } = await supabase
    .from('stock_movements')
    .select('branch_id, quantity, created_at')
    .eq('type', 'out')
    .gte('created_at', startWindow.toISOString())
    .lt('created_at', endWindow.toISOString());

  const grouped = {};
  for (const m of movements || []) {
    const d = new Date(m.created_at);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const key = `${ym}_${m.branch_id}`;
    if (!grouped[key]) grouped[key] = { year_month: ym, branch_id: m.branch_id, total: 0 };
    grouped[key].total += m.quantity;
  }

  const byMonth = {};
  for (const item of Object.values(grouped)) {
    if (!byMonth[item.year_month]) byMonth[item.year_month] = [];
    byMonth[item.year_month].push(item);
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const result = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ym, items]) => {
      const [, month] = ym.split('-');
      const sorted = items.sort((a, b) => b.total - a.total).slice(0, 3);
      return {
        month_key: ym,
        month_label: `${monthNames[parseInt(month) - 1]} ${ym.split('-')[0]}`,
        top_branches: sorted.map((item, i) => ({
          rank: i + 1,
          branch_id: item.branch_id,
          branch_name: branchMap[item.branch_id] || 'Unknown',
          total: item.total,
        })),
      };
    });

  return result;
}

module.exports = { list, getStocks, getSalesTrend };
