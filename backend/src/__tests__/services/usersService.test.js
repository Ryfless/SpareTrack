jest.mock('../../config/supabase');

const { supabaseAdmin: supabase } = require('../../config/supabase');
const service = require('../../services/usersService');

function cloneChain() {
  const methods = ['select', 'eq', 'single', 'or', 'order', 'range', 'upsert', 'update', 'insert'];
  const c = { _mockResolve: { data: null, error: null }, then(fn) { return Promise.resolve(fn(this._mockResolve)); }, catch() { return Promise.resolve(); } };
  for (const m of methods) c[m] = jest.fn().mockReturnValue(c);
  return c;
}

beforeEach(() => {
  jest.clearAllMocks();
  supabase.from.mockImplementation(() => cloneChain());
});

describe('list', () => {
  it('returns paginated users', async () => {
    const chain = cloneChain();
    chain._mockResolve = { data: [{ id: 'u-1', email: 'a@a.com', full_name: 'User A', phone: '', branch: '', role: 'branch_admin', is_active: true, avatar_url: null, created_at: '2026-01-01', updated_at: null }], count: 1, error: null };
    supabase.from.mockReturnValueOnce(chain);

    const result = await service.list({ page: 1, limit: 10 });

    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(chain.select).toHaveBeenCalledWith('*', { count: 'exact' });
    expect(chain.range).toHaveBeenCalledWith(0, 9);
    expect(result.meta).toEqual({ page: 1, limit: 10, total: 1, total_pages: 1 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].email).toBe('a@a.com');
  });

  it('filters by search keyword', async () => {
    const chain = cloneChain();
    chain._mockResolve = { data: [{ id: 'u-2', email: 'b@b.com', full_name: 'Bob', phone: '', branch: '', role: 'branch_admin', is_active: true, avatar_url: null, created_at: '2026-01-01', updated_at: null }], count: 1, error: null };
    supabase.from.mockReturnValueOnce(chain);

    const result = await service.list({ page: 1, limit: 20, search: 'Bob' });

    expect(chain.or).toHaveBeenCalledWith('full_name.ilike.%Bob%,email.ilike.%Bob%');
    expect(result.data).toHaveLength(1);
    expect(result.data[0].full_name).toBe('Bob');
  });

  it('filters by role', async () => {
    const chain = cloneChain();
    chain._mockResolve = { data: [], count: 0, error: null };
    supabase.from.mockReturnValueOnce(chain);

    await service.list({ page: 1, limit: 20, role: 'super_admin' });

    expect(chain.eq).toHaveBeenCalledWith('role', 'super_admin');
  });
});

describe('detail', () => {
  it('returns user profile when found', async () => {
    const chain = cloneChain();
    chain._mockResolve = { data: { id: 'u-1', email: 'a@a.com', full_name: 'User A', phone: '08123', branch: 'Cabang A', role: 'branch_admin', is_active: true, avatar_url: null, created_at: '2026-01-01', updated_at: null }, error: null };
    supabase.from.mockReturnValueOnce(chain);

    const result = await service.detail('u-1');

    expect(result.id).toBe('u-1');
    expect(result.email).toBe('a@a.com');
    expect(result.full_name).toBe('User A');
  });

  it('returns null when user not found', async () => {
    const chain = cloneChain();
    chain._mockResolve = { data: null, error: { message: 'not found' } };
    supabase.from.mockReturnValueOnce(chain);

    const result = await service.detail('unknown');

    expect(result).toBeNull();
  });
});
