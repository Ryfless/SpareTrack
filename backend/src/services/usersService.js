const { supabaseAdmin: supabase } = require('../config/supabase');

async function list(query) {
  const { page = 1, limit = 20, search, role, is_active } = query;
  const offset = (Number(page) - 1) * Number(limit);

  let qry = supabase
    .from('profiles')
    .select('*', { count: 'exact' });

  if (role) qry = qry.eq('role', role);
  if (is_active !== undefined) qry = qry.eq('is_active', is_active === 'true' || is_active === true);
  if (search) {
    qry = qry.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  qry = qry.order('created_at', { ascending: false });

  const { data, count, error } = await qry.range(offset, offset + Number(limit) - 1);
  if (error) throw error;

  return {
    data: (data || []).map(u => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      phone: u.phone,
      branch: u.branch,
      role: u.role,
      is_active: u.is_active,
      avatar_url: u.avatar_url,
      created_at: u.created_at,
      updated_at: u.updated_at,
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
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    email: data.email,
    full_name: data.full_name,
    phone: data.phone,
    branch: data.branch,
    role: data.role,
    is_active: data.is_active,
    avatar_url: data.avatar_url,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

async function create(data) {
  const { email, full_name, password, role, branch, phone } = data;

  if (!email || !full_name || !password) {
    const err = new Error('email, full_name, dan password wajib diisi');
    err.status = 400;
    throw err;
  }

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role: role || 'branch_admin', branch: branch || '', phone: phone || '' },
  });

  if (authError) {
    const err = new Error(authError.message);
    err.status = 400;
    throw err;
  }

  const userId = authUser.user.id;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email,
      full_name,
      phone: phone || '',
      branch: branch || '',
      role: role || 'branch_admin',
    })
    .select()
    .single();

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId);
    throw profileError;
  }

  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    phone: profile.phone,
    branch: profile.branch,
    role: profile.role,
    is_active: true,
    created_at: profile.created_at,
  };
}

async function update(id, data) {
  const { full_name, role, branch, phone, is_active } = data;

  const updateData = {};
  if (full_name !== undefined) updateData.full_name = full_name;
  if (role !== undefined) updateData.role = role;
  if (branch !== undefined) updateData.branch = branch;
  if (phone !== undefined) updateData.phone = phone;

  if (Object.keys(updateData).length > 0) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id);

    if (profileError) throw profileError;
  }

  if (is_active !== undefined) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name, role, branch, phone')
      .eq('id', id)
      .single();

    if (profile) {
      await supabase.auth.admin.updateUserById(id, {
        user_metadata: {
          full_name: profile.full_name,
          role: profile.role,
          branch: profile.branch || '',
          phone: profile.phone || '',
          is_active: String(is_active),
        },
      });
    }
  }

  return detail(id);
}

async function toggleActive(id) {
  const { data: profile, error: findError } = await supabase
    .from('profiles')
    .select('id, is_active')
    .eq('id', id)
    .single();

  if (findError || !profile) return null;

  const newActive = !profile.is_active;

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: newActive })
    .eq('id', id);

  if (error) throw error;

  await supabase.auth.admin.updateUserById(id, {
    user_metadata: { is_active: String(newActive) },
  });

  return { id, is_active: newActive };
}

module.exports = {
  list, detail, create, update, toggleActive,
};
