const { supabaseAdmin: supabase } = require('../config/supabase');

async function getSummary(userId) {
  const { data: { user } } = await supabase.auth.admin.getUserById(userId);
  const userRole = user?.user_metadata?.role || 'branch_admin';
  const userBranch = user?.user_metadata?.branch || '';

  let branchFilter = '';
  if (userRole === 'branch_admin' && userBranch) {
    branchFilter = userBranch;
  }

  const totalSpareparts = await supabase.from('spareparts').select('id', { count: 'exact', head: true });
  const totalBranches = await supabase.from('branches').select('id', { count: 'exact', head: true });

  let stockQuery = supabase.from('branch_stocks').select('quantity');
  if (branchFilter) {
    const { data: branch } = await supabase.from('branches').select('id').eq('name', branchFilter).single();
    if (branch) stockQuery = stockQuery.eq('branch_id', branch.id);
  }
  const { data: allStocks } = await stockQuery;
  const totalStock = allStocks?.reduce((sum, s) => sum + s.quantity, 0) || 0;

  const { data: lowStockItems } = await supabase
    .from('spareparts')
    .select('id, name, code, min_stock, safety_stock')
    .lt('safety_stock', 10);

  const { data: criticalStocks } = await supabase
    .from('branch_stocks')
    .select('quantity, spareparts!inner(safety_stock)')
    .lte('quantity', 0);

  const { data: lowCriticalItems } = await supabase
    .from('branch_stocks')
    .select('quantity, spareparts!inner(id, name, safety_stock)');

  let critical = 0;
  if (lowCriticalItems) {
    critical = lowCriticalItems.filter(s => s.quantity <= (s.spareparts?.safety_stock || 5)).length;
  }

  const { data: recentActivity } = await supabase
    .from('activities')
    .select('id, action, description, entity_type, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: monthlyTrend } = await supabase
    .from('stock_movements')
    .select('created_at, quantity, type, branch_id')
    .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true });

  const { data: forecastRuns } = await supabase
    .from('forecast_runs')
    .select('id, status, created_at')
    .order('created_at', { ascending: false })
    .limit(1);

  const forecastStatus = forecastRuns?.length > 0 ? forecastRuns[0].status : null;

  return {
    kpi: {
      total_spareparts: totalSpareparts.count || 0,
      total_branches: totalBranches.count || 0,
      total_stock: totalStock,
      total_value: 0,
      critical_stock: critical,
      low_stock: lowStockItems?.length || 0,
    },
    recent_activity: recentActivity || [],
    monthly_trend: monthlyTrend || [],
    forecast_status: forecastStatus,
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
