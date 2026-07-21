const { supabaseAdmin: supabase } = require('../config/supabase');

async function summary(query) {
  const { branch_id, start_date, end_date } = query;

  const defaultStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const defaultEnd = new Date().toISOString();

  let movQuery = supabase
    .from('stock_movements')
    .select('type, quantity, created_at, branch_id, sparepart_id');

  if (branch_id) movQuery = movQuery.eq('branch_id', branch_id);
  movQuery = movQuery
    .gte('created_at', start_date || defaultStart)
    .lte('created_at', end_date || defaultEnd);

  const { data: movements } = await movQuery;

  const totalIn = movements?.filter(m => m.type === 'in').reduce((s, m) => s + m.quantity, 0) || 0;
  const totalOut = movements?.filter(m => m.type === 'out').reduce((s, m) => s + Math.abs(m.quantity), 0) || 0;
  const totalAdjustment = movements?.filter(m => m.type === 'adjustment').reduce((s, m) => s + m.quantity, 0) || 0;
  const totalTransfer = movements?.filter(m => m.type === 'transfer').length || 0;

  const { data: sparepartCount } = await supabase
    .from('spareparts')
    .select('id', { count: 'exact', head: true });

  const { data: criticalItems } = await supabase
    .from('branch_stocks')
    .select('*, spareparts(name, code), branches(name)', { count: 'exact' })
    .lte('quantity', 10);

  return {
    period: {
      start: start_date || defaultStart,
      end: end_date || defaultEnd,
    },
    stock_movements: {
      total_in: totalIn,
      total_out: totalOut,
      total_adjustment: totalAdjustment,
      total_transfer: totalTransfer,
      net_flow: totalIn - totalOut,
    },
    inventory: {
      total_items: sparepartCount?.count || 0,
      critical_items: criticalItems?.length || 0,
      critical_list: (criticalItems || []).map(c => ({
        name: c.spareparts?.name || '',
        code: c.spareparts?.code || '',
        branch: c.branches?.name || '',
        quantity: c.quantity,
      })),
    },
  };
}

module.exports = { summary };
