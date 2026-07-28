const { supabaseAdmin } = require('../config/supabase');

async function logLogin(userId, ipAddress, userAgent) {
  const { data, error } = await supabaseAdmin
    .from('login_history')
    .insert({
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
      login_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[LoginHistory LogLogin Error]', error);
    throw error;
  }

  return data;
}

async function logLogout(userId) {
  const { data: latest } = await supabaseAdmin
    .from('login_history')
    .select('id')
    .eq('user_id', userId)
    .is('logout_at', null)
    .order('login_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest) return null;

  const { data, error } = await supabaseAdmin
    .from('login_history')
    .update({ logout_at: new Date().toISOString() })
    .eq('id', latest.id)
    .select()
    .single();

  if (error) {
    console.error('[LoginHistory LogLogout Error]', error);
    throw error;
  }

  return data;
}

async function listByUser(userId) {
  const { data, error } = await supabaseAdmin
    .from('login_history')
    .select('*')
    .eq('user_id', userId)
    .order('login_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[LoginHistory List Error]', error);
    throw error;
  }

  return data || [];
}

module.exports = { logLogin, logLogout, listByUser };
