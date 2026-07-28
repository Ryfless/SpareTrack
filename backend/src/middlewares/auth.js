const { supabase, supabaseAdmin } = require('../config/supabase');
const { error } = require('../utils/response');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Unauthorized: no token provided', null, 401);
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return error(res, 'Invalid or expired token', null, 401);
  }

  req.user = user;
  req.accessToken = token;
  next();
}

async function resolveRole(userId) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  return profile?.role || 'branch_admin';
}

function authorize(...roles) {
  return async (req, res, next) => {
    let userRole = req.user?.app_metadata?.role
      || req.user?.user_metadata?.role
      || 'branch_admin';

    if (roles.length > 0 && !roles.includes(userRole)) {
      userRole = await resolveRole(req.user.id);
    }

    if (roles.length > 0 && !roles.includes(userRole)) {
      return error(res, 'Forbidden: insufficient role', null, 403);
    }

    req.userRole = userRole;
    next();
  };
}

module.exports = { authenticate, authorize };
