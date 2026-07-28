jest.mock('../../config/supabase');

const { supabaseAdmin: supabase } = require('../../config/supabase');
const auditLogService = require('../../services/auditLogService');

function cloneChain() {
  const methods = ['select', 'eq', 'or', 'gte', 'lte', 'order', 'range', 'single', 'insert'];
  const c = { _mockResolve: { data: null, error: null, count: 0 }, then(fn) { return Promise.resolve(fn(this._mockResolve)); }, catch() { return Promise.resolve(); } };
  for (const m of methods) c[m] = jest.fn().mockReturnValue(c);
  return c;
}

const mockLog = { id: 'al-1', user_id: 'u-1', action: 'update', entity_type: 'sparepart', entity_id: 'sp-1', profiles: { full_name: 'Admin', email: 'admin@test.com' }, old_data: {}, new_data: {}, ip_address: '127.0.0.1', created_at: '2026-01-01' };

beforeEach(() => { jest.clearAllMocks(); supabase.from.mockImplementation(() => cloneChain()); });

describe('list', () => {
  it('returns paginated audit logs', async () => {
    const chain = cloneChain();
    chain._mockResolve = { data: [mockLog], count: 1, error: null };
    supabase.from.mockReturnValueOnce(chain);

    const result = await auditLogService.list({});

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(result.data[0].user_name).toBe('Admin');
  });

  it('applies filters', async () => {
    const chain = cloneChain();
    chain._mockResolve = { data: [mockLog], count: 1, error: null };
    supabase.from.mockReturnValueOnce(chain);

    await auditLogService.list({ action: 'update', entity_type: 'sparepart', user_id: 'u-1' });

    expect(chain.eq).toHaveBeenCalledWith('action', 'update');
    expect(chain.eq).toHaveBeenCalledWith('entity_type', 'sparepart');
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'u-1');
  });
});

describe('detail', () => {
  it('returns audit log detail', async () => {
    const chain = cloneChain();
    chain.single.mockResolvedValue({ data: mockLog, error: null });
    supabase.from.mockReturnValueOnce(chain);

    const result = await auditLogService.detail('al-1');

    expect(result.user_name).toBe('Admin');
  });

  it('returns null when not found', async () => {
    const chain = cloneChain();
    chain.single.mockResolvedValue({ data: null, error: { message: 'not found' } });
    supabase.from.mockReturnValueOnce(chain);

    const result = await auditLogService.detail('unknown');
    expect(result).toBeNull();
  });
});
