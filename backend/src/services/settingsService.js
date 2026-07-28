const { supabaseAdmin: supabase } = require('../config/supabase');

async function getSettings(userId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!profile) return {};

  let branchFilter;
  if (profile.role === 'super_admin') {
    const { data: branches } = await supabase.from('branches').select('id, name');
    branchFilter = branches || [];
  } else if (profile.branch) {
    const { data: branch } = await supabase
      .from('branches')
      .select('id, name')
      .eq('name', profile.branch)
      .single();
    branchFilter = branch ? [branch] : [];
  }

  const { data: settings } = await supabase
    .from('settings')
    .select('*');

  const settingsMap = {};
  for (const s of settings || []) {
    const key = s.branch_id ? `${s.branch_id}:${s.key}` : s.key;
    settingsMap[key] = s.value;
  }

  const { data: apiTokens } = await supabase
    .from('api_tokens')
    .select('id, name, is_active, created_at, last_used_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return {
    profile: {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      phone: profile.phone,
      branch: profile.branch,
      role: profile.role,
      avatar_url: profile.avatar_url,
    },
    branches: branchFilter || [],
    settings: settingsMap,
    api_tokens: apiTokens || [],
  };
}

async function updateSettings(userId, data) {
  const { key, value, branch_id } = data;

  if (!key || value === undefined) {
    const err = new Error('key dan value wajib diisi');
    err.status = 400;
    throw err;
  }

  const upsertData = {
    key,
    value: typeof value === 'string' ? value : JSON.stringify(value),
    updated_by: userId,
    branch_id: branch_id || null,
  };

  if (branch_id) {
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('key', key)
      .eq('branch_id', branch_id)
      .maybeSingle();

    if (existing) {
      const { data: updated, error } = await supabase
        .from('settings')
        .update(upsertData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    }
  }

  const { data: result, error } = await supabase
    .from('settings')
    .insert(upsertData)
    .select()
    .single();

  if (error) throw error;
  return result;
}

module.exports = { getSettings, updateSettings };
