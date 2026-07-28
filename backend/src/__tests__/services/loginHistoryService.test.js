jest.mock('../../config/supabase');

const { supabaseAdmin: supabase } = require('../../config/supabase');
const loginHistoryService = require('../../services/loginHistoryService');

function cloneChain() {
  const methods = ['select', 'eq', 'is', 'order', 'limit', 'range', 'single', 'maybeSingle', 'insert', 'update'];
  const c = { _mockResolve: { data: null, error: null }, then(fn) { return Promise.resolve(fn(this._mockResolve)); }, catch() { return Promise.resolve(); } };
  for (const m of methods) c[m] = jest.fn().mockReturnValue(c);
  return c;
}

beforeEach(() => { jest.clearAllMocks(); supabase.from.mockImplementation(() => cloneChain()); });

describe('logLogin', () => {
  it('inserts login history and returns data', async () => {
    const chain = cloneChain();
    chain.single.mockResolvedValue({ data: { id: 'lh-1', user_id: 'u-1' }, error: null });
    supabase.from.mockReturnValueOnce(chain);

    const result = await loginHistoryService.logLogin('u-1', '127.0.0.1', 'Mozilla');

    expect(supabase.from).toHaveBeenCalledWith('login_history');
    expect(result).toEqual({ id: 'lh-1', user_id: 'u-1' });
  });

  it('throws on error', async () => {
    const chain = cloneChain();
    chain.single.mockResolvedValue({ data: null, error: new Error('db error') });
    supabase.from.mockReturnValueOnce(chain);

    await expect(loginHistoryService.logLogin('u-1', 'ip', 'ua')).rejects.toThrow('db error');
  });
});

describe('logLogout', () => {
  it('updates the latest login record', async () => {
    const getChain = cloneChain();
    getChain.maybeSingle.mockResolvedValue({ data: { id: 'lh-1' }, error: null });

    const updChain = cloneChain();
    updChain.single.mockResolvedValue({ data: { id: 'lh-1', logout_at: '2026-01-01' }, error: null });

    supabase.from.mockReturnValueOnce(getChain).mockReturnValueOnce(updChain);

    const result = await loginHistoryService.logLogout('u-1');

    expect(result.logout_at).toBe('2026-01-01');
  });

  it('returns null when no active session', async () => {
    const chain = cloneChain();
    chain.maybeSingle.mockResolvedValue({ data: null, error: null });
    supabase.from.mockReturnValueOnce(chain);

    const result = await loginHistoryService.logLogout('u-1');
    expect(result).toBeNull();
  });
});

describe('listByUser', () => {
  it('returns login history for user', async () => {
    const chain = cloneChain();
    chain._mockResolve = { data: [{ id: 'lh-1' }], error: null };
    supabase.from.mockReturnValueOnce(chain);

    const result = await loginHistoryService.listByUser('u-1');

    expect(result).toHaveLength(1);
  });
});
