const { supabaseAdmin: supabase } = require('../config/supabase');

async function runs(query) {
  const { branch_id, limit = 10 } = query;

  let qry = supabase
    .from('forecast_runs')
    .select('*, branches(name), profiles(full_name)')
    .order('created_at', { ascending: false });

  if (branch_id) qry = qry.eq('branch_id', branch_id);

  const { data, error } = await qry.limit(Number(limit));
  if (error) throw error;

  return (data || []).map(r => ({
    id: r.id,
    method: r.method,
    period_start: r.period_start,
    period_end: r.period_end,
    status: r.status,
    branch: r.branches?.name || '',
    generated_by: r.profiles?.full_name || '',
    created_at: r.created_at,
  }));
}

async function runDetail(id) {
  const { data: run, error } = await supabase
    .from('forecast_runs')
    .select('*, branches(name), profiles(full_name)')
    .eq('id', id)
    .single();

  if (error || !run) return null;

  const { data: seriesData } = await supabase
    .from('forecast_series')
    .select('*, spareparts(name, code), branches(name)')
    .eq('forecast_run_id', id)
    .order('month', { ascending: true })
    .limit(100);

  return {
    id: run.id,
    method: run.method,
    period_start: run.period_start,
    period_end: run.period_end,
    status: run.status,
    branch: run.branches?.name || '',
    generated_by: run.profiles?.full_name || '',
    created_at: run.created_at,
    series: (seriesData || []).map(s => ({
      id: s.id,
      month: s.month,
      predicted_quantity: s.predicted_quantity,
      confidence_lower: s.confidence_lower,
      confidence_upper: s.confidence_upper,
      sparepart: s.spareparts?.name || '',
      sparepart_code: s.spareparts?.code || '',
      branch: s.branches?.name || '',
    })),
  };
}

async function createRun(data) {
  const { branch_id, method, period_start, period_end, generated_by } = data;

  if (!period_start || !period_end) {
    const err = new Error('period_start dan period_end wajib diisi');
    err.status = 400;
    throw err;
  }

  const { data: run, error } = await supabase
    .from('forecast_runs')
    .insert({
      branch_id: branch_id || null,
      method: method || 'moving_average',
      period_start,
      period_end,
      status: 'running',
      generated_by,
    })
    .select()
    .single();

  if (error) throw error;

  try {
    const { data: spareparts } = await supabase
      .from('spareparts')
      .select('id, name, code')
      .eq('is_active', true);

    if (!spareparts || spareparts.length === 0) {
      await supabase.from('forecast_runs').update({ status: 'completed' }).eq('id', run.id);
      run.status = 'completed';
      return run;
    }

    const startDate = new Date(period_start);
    const endDate = new Date(period_end);
    const smaPeriod = 3;

    const seriesData = [];

    for (const sp of spareparts) {
      const { data: movements } = await supabase
        .from('stock_movements')
        .select('type, quantity, created_at')
        .eq('sparepart_id', sp.id)
        .order('created_at', { ascending: false });

      const monthlyOut = {};
      for (const m of movements || []) {
        if (m.type !== 'out') continue;
        const monthKey = new Date(m.created_at).toISOString().slice(0, 7);
        monthlyOut[monthKey] = (monthlyOut[monthKey] || 0) + Math.abs(m.quantity);
      }

      const sortedMonths = Object.keys(monthlyOut).sort();
      const smaValues = sortedMonths.slice(-smaPeriod).map(m => monthlyOut[m]);
      const sma = smaValues.length > 0
        ? Math.round(smaValues.reduce((s, v) => s + v, 0) / smaValues.length)
        : null;

      let cursor = new Date(startDate);
      while (cursor <= endDate) {
        const predicted = sma !== null ? sma : Math.round(5 + Math.random() * 20);
        seriesData.push({
          forecast_run_id: run.id,
          sparepart_id: sp.id,
          branch_id: branch_id || null,
          month: cursor.toISOString().slice(0, 7) + '-01',
          predicted_quantity: predicted,
          confidence_lower: Math.max(0, Math.round(predicted * 0.7)),
          confidence_upper: Math.round(predicted * 1.3),
        });
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    if (seriesData.length > 0) {
      await supabase.from('forecast_series').insert(seriesData);
    }

    await supabase
      .from('forecast_runs')
      .update({ status: 'completed' })
      .eq('id', run.id);

    run.status = 'completed';
  } catch (err) {
    await supabase
      .from('forecast_runs')
      .update({ status: 'failed' })
      .eq('id', run.id);

    run.status = 'failed';
    throw err;
  }

  return run;
}

async function series(query) {
  const { sparepart_id, branch_id, forecast_run_id, limit = 50 } = query;

  let qry = supabase
    .from('forecast_series')
    .select('*, spareparts(name, code), branches(name)')
    .order('month', { ascending: true });

  if (sparepart_id) qry = qry.eq('sparepart_id', sparepart_id);
  if (branch_id) qry = qry.eq('branch_id', branch_id);
  if (forecast_run_id) qry = qry.eq('forecast_run_id', forecast_run_id);

  const { data, error } = await qry.limit(Number(limit));
  if (error) throw error;

  return (data || []).map(s => ({
    id: s.id,
    month: s.month,
    predicted_quantity: s.predicted_quantity,
    confidence_lower: s.confidence_lower,
    confidence_upper: s.confidence_upper,
    sparepart: s.spareparts?.name || '',
    sparepart_code: s.spareparts?.code || '',
    branch: s.branches?.name || '',
  }));
}

module.exports = { runs, runDetail, createRun, series };
