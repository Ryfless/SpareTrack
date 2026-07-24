const { supabaseAdmin: supabase } = require('../config/supabase');

async function getSummary(userId) {
  const { data: { user } } = await supabase.auth.admin.getUserById(userId);
  const userRole = user?.user_metadata?.role || 'branch_admin';
  const userBranch = user?.user_metadata?.branch || '';

  let branchId = null;
  if (userRole === 'branch_admin' && userBranch) {
    const { data: b } = await supabase.from('branches').select('id').eq('name', userBranch).single();
    if (b) branchId = b.id;
  }

  const [totalSpareparts, totalBranches] = await Promise.all([
    supabase.from('spareparts').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('branches').select('id', { count: 'exact', head: true }),
  ]);

  let [spResult, bsResult] = await Promise.all([
    supabase.from('spareparts').select('id, max_stock, min_stock, safety_stock, reorder_point, price').eq('is_active', true),
    branchId
      ? supabase.from('branch_stocks').select('quantity, sparepart_id').eq('branch_id', branchId)
      : supabase.from('branch_stocks').select('quantity, sparepart_id'),
  ]);

  const spareparts = spResult.data || [];
  const branchStocks = bsResult.data || [];

  const stockBySpId = {};
  for (const bs of branchStocks) {
    if (!stockBySpId[bs.sparepart_id]) stockBySpId[bs.sparepart_id] = 0;
    stockBySpId[bs.sparepart_id] += bs.quantity || 0;
  }

  let totalStock = 0, totalValue = 0, critical = 0, low = 0, overstock = 0, safe = 0;

  for (const sp of spareparts) {
    const qty = stockBySpId[sp.id] || 0;
    totalStock += qty;
    totalValue += qty * (Number(sp.price) || 0);

    const overstockThreshold = sp.max_stock ?? sp.min_stock * 5;
    if (qty <= sp.safety_stock) critical++;
    else if (qty <= sp.reorder_point) low++;
    else if (qty >= overstockThreshold) overstock++;
    else safe++;
  }

  const [recentActivity, monthlyTrend, forecastRuns] = await Promise.all([
    supabase
      .from('activities')
      .select('id, action, description, entity_type, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('stock_movements')
      .select('created_at, quantity, type, branch_id')
      .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('forecast_runs')
      .select('id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  return {
    kpi: {
      total_spareparts: totalSpareparts.count || 0,
      total_branches: totalBranches.count || 0,
      total_stock: totalStock,
      total_value: totalValue,
      critical_stock: critical,
      low_stock: low,
      overstock,
      safe,
    },
    recent_activity: recentActivity?.data || [],
    monthly_trend: monthlyTrend?.data || [],
    forecast_status: forecastRuns?.data?.length > 0 ? forecastRuns.data[0].status : null,
  };
}

async function getRecentActivity(userId) {
  const { data, error } = await supabase
    .from('activities')
    .select('id, action, description, entity_type, entity_id, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data;
}

module.exports = { getSummary, getRecentActivity };
