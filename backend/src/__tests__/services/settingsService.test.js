jest.mock('../../config/supabase');

const { supabaseAdmin: supabase } = require('../../config/supabase');
const service = require('../../services/settingsService');

function cloneChain() {
  const methods = ['select', 'eq', 'single', 'order', 'maybeSingle', 'update', 'insert'];
  const c = { _mockResolve: { data: null, error: null }, then(fn) { return Promise.resolve(fn(this._mockResolve)); }, catch() { return Promise.resolve(); } };
  for (const m of methods) c[m] = jest.fn().mockReturnValue(c);
  return c;
}

beforeEach(() => {
  jest.clearAllMocks();
  supabase.from.mockImplementation(() => cloneChain());
});

describe('getSettings', () => {
  it('returns settings for super_admin with all branches', async () => {
    const profileChain = cloneChain();
    profileChain._mockResolve = { data: { id: 'u-1', email: 'admin@test.com', role: 'super_admin' }, error: null };

    const branchesChain = cloneChain();
    branchesChain._mockResolve = { data: [{ id: 'b-1', name: 'Cabang A' }, { id: 'b-2', name: 'Cabang B' }], error: null };

    const settingsChain = cloneChain();
    settingsChain._mockResolve = { data: [{ key: 'theme', value: 'dark' }], error: null };

    const tokensChain = cloneChain();
    tokensChain._mockResolve = { data: [{ id: 't-1', name: 'API Key', is_active: true, created_at: '2026-01-01', last_used_at: null }], error: null };

    supabase.from
      .mockReturnValueOnce(profileChain)
      .mockReturnValueOnce(branchesChain)
      .mockReturnValueOnce(settingsChain)
      .mockReturnValueOnce(tokensChain);

    const result = await service.getSettings('u-1');

    expect(result.profile.role).toBe('super_admin');
    expect(result.branches).toHaveLength(2);
    expect(result.settings).toEqual({ theme: 'dark' });
    expect(result.api_tokens).toHaveLength(1);
  });

  it('returns settings for branch_admin with branch filter', async () => {
    const profileChain = cloneChain();
    profileChain._mockResolve = { data: { id: 'u-2', email: 'user@test.com', role: 'branch_admin', branch: 'Cabang A' }, error: null };

    const branchChain = cloneChain();
    branchChain._mockResolve = { data: { id: 'b-1', name: 'Cabang A' }, error: null };

    const settingsChain = cloneChain();
    settingsChain._mockResolve = { data: [{ key: 'theme', value: 'light', branch_id: 'b-1' }], error: null };

    const tokensChain = cloneChain();
    tokensChain._mockResolve = { data: [], error: null };

    supabase.from
      .mockReturnValueOnce(profileChain)
      .mockReturnValueOnce(branchChain)
      .mockReturnValueOnce(settingsChain)
      .mockReturnValueOnce(tokensChain);

    const result = await service.getSettings('u-2');

    expect(result.profile.role).toBe('branch_admin');
    expect(result.branches).toHaveLength(1);
    expect(result.branches[0].id).toBe('b-1');
    expect(result.settings).toEqual({ 'b-1:theme': 'light' });
  });

  it('returns empty object when profile is null', async () => {
    const chain = cloneChain();
    chain._mockResolve = { data: null, error: null };
    supabase.from.mockReturnValueOnce(chain);

    const result = await service.getSettings('unknown');

    expect(result).toEqual({});
  });
});

describe('updateSettings', () => {
  it('inserts a new setting when no existing record found', async () => {
    const chain = cloneChain();
    chain.single.mockResolvedValue({ data: { key: 'theme', value: 'dark' }, error: null });
    supabase.from.mockReturnValueOnce(chain);

    const result = await service.updateSettings('u-1', { key: 'theme', value: 'dark' });

    expect(chain.insert).toHaveBeenCalled();
    expect(result.key).toBe('theme');
  });

  it('throws 400 when key or value is missing', async () => {
    await expect(service.updateSettings('u-1', { value: 'dark' })).rejects.toThrow('key dan value wajib diisi');
    await expect(service.updateSettings('u-1', { key: 'theme' })).rejects.toThrow('key dan value wajib diisi');
  });

  it('updates existing setting when found by key and branch_id', async () => {
    const existingChain = cloneChain();
    existingChain._mockResolve = { data: { id: 's-1' }, error: null };
    supabase.from.mockReturnValueOnce(existingChain);

    const updateChain = cloneChain();
    updateChain.single.mockResolvedValue({ data: { id: 's-1', key: 'theme', value: 'dark', branch_id: 'b-1' }, error: null });
    supabase.from.mockReturnValueOnce(updateChain);

    const result = await service.updateSettings('u-1', { key: 'theme', value: 'dark', branch_id: 'b-1' });

    expect(updateChain.update).toHaveBeenCalled();
    expect(result.branch_id).toBe('b-1');
  });
});
