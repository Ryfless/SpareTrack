const { supabase, supabaseAdmin } = require('../config/supabase');

async function registerUser(email, password, metadata) {
  const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: metadata.fullName,
      phone: metadata.phone,
      branch: metadata.branch,
      role: 'branch_admin',
    },
  });

  if (createError) throw createError;

  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    id: data.user.id,
    email,
    full_name: metadata.fullName,
    phone: metadata.phone,
    branch: metadata.branch,
    role: 'branch_admin',
  });

  if (profileError) {
    console.error('[Profile Insert Error]', profileError);
  }

  return data;
}

async function loginUser(email, password) {
  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) throw signInError;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  return {
    session: data.session,
    user: { ...data.user, profile },
  };
}

async function requestOtp(email) {
  const { data, error: otpError } = await supabase.auth.signInWithOtp({ email });
  if (otpError) {
    console.error('[OTP ERROR]', otpError);
    throw otpError;
  }
  console.log('[OTP SENT]', { email, data });
  return data;
}

async function verifyOtp(email, token) {
  const { data, error: verifyError } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  if (verifyError) throw verifyError;
  return data;
}

async function signInWithGoogle() {
  const { data, error: googleError } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });
  if (googleError) throw googleError;
  return data;
}

async function getProfile(userId) {
  const { data, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) return null;
  return data;
}

async function updateProfile(userId, data) {
  const updates = {};
  if (data.full_name !== undefined) updates.full_name = data.full_name;
  if (data.phone !== undefined) updates.phone = data.phone;
  if (data.branch !== undefined) updates.branch = data.branch;
  if (data.theme_preference !== undefined) updates.theme_preference = data.theme_preference;
  updates.updated_at = new Date().toISOString();

  if (Object.keys(updates).length === 1) return getProfile(userId);

  const { error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) throw error;

  if (updates.full_name || updates.branch || updates.phone) {
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        full_name: updates.full_name || undefined,
        branch: updates.branch || undefined,
        phone: updates.phone || undefined,
      },
    });
  }

  return getProfile(userId);
}

module.exports = {
  registerUser,
  loginUser,
  requestOtp,
  verifyOtp,
  signInWithGoogle,
  getProfile,
  updateProfile,
};
