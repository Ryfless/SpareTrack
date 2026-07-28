const methods = [
  'select', 'eq', 'neq', 'in_', 'or', 'order', 'limit', 'range',
  'single', 'maybeSingle', 'execute', 'textSearch',
  'insert', 'update', 'delete', 'upsert',
  'is', 'not', 'gte', 'lt', 'lte', 'gt',
  'ilike', 'like',
];

function buildChain() {
  const chain = {};
  for (const m of methods) {
    chain[m] = jest.fn().mockReturnValue(chain);
  }
  return chain;
}

const mockSupabaseAdmin = buildChain();
mockSupabaseAdmin.auth = {
  admin: {
    createUser: jest.fn(),
    updateUserById: jest.fn(),
    signOut: jest.fn(),
  },
};

const mockSupabase = buildChain();
mockSupabase.auth = {
  getUser: jest.fn(),
  signInWithPassword: jest.fn(),
  signInWithOtp: jest.fn(),
  verifyOtp: jest.fn(),
  signInWithOAuth: jest.fn(),
};

module.exports = { mockSupabaseAdmin, mockSupabase, buildChain };
