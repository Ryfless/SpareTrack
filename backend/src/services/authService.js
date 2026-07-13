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

  const { error: profileError } = await supabase.from('profiles').insert({
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

  const { data: profile } = await supabase
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
  if (otpError) throw otpError;
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
  const { data, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) return null;
  return data;
}

module.exports = {
  registerUser,
  loginUser,
  requestOtp,
  verifyOtp,
  signInWithGoogle,
  getProfile,
};
