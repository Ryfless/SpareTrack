const { supabaseAdmin: supabase } = require('../config/supabase');

async function list(query) {
  const { page = 1, limit = 20, action, entity_type, user_id, start_date, end_date, search } = query;
  const offset = (Number(page) - 1) * Number(limit);

  let qry = supabase
    .from('audit_logs')
    .select('*, profiles(full_name, email)', { count: 'exact' });

  if (action) qry = qry.eq('action', action);
  if (entity_type) qry = qry.eq('entity_type', entity_type);
  if (user_id) qry = qry.eq('user_id', user_id);
  if (start_date) qry = qry.gte('created_at', start_date);
  if (end_date) qry = qry.lte('created_at', end_date);
  if (search) {
    qry = qry.or(`action.ilike.%${search}%,entity_type.ilike.%${search}%`);
  }

  qry = qry.order('created_at', { ascending: false });

  const { data, count, error } = await qry.range(offset, offset + Number(limit) - 1);
  if (error) throw error;

  return {
    data: (data || []).map(log => ({
      id: log.id,
      user_id: log.user_id,
      user_name: log.profiles?.full_name || '',
      user_email: log.profiles?.email || '',
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      old_data: log.old_data,
      new_data: log.new_data,
      ip_address: log.ip_address,
      created_at: log.created_at,
    })),
    meta: {
      page: Number(page),
      limit: Number(limit),
      total: count || 0,
      total_pages: Math.ceil((count || 0) / Number(limit)),
    },
  };
}

async function detail(id) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*, profiles(full_name, email)')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    user_id: data.user_id,
    user_name: data.profiles?.full_name || '',
    user_email: data.profiles?.email || '',
    action: data.action,
    entity_type: data.entity_type,
    entity_id: data.entity_id,
    old_data: data.old_data,
    new_data: data.new_data,
    ip_address: data.ip_address,
    created_at: data.created_at,
  };
}

module.exports = { list, detail };
