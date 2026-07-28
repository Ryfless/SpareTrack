jest.mock('../../config/supabase');

const { supabaseAdmin: supabase } = require('../../config/supabase');
const service = require('../../services/branchesService');

function cloneChain() {
  const methods = ['select', 'eq', 'order', 'single', 'maybeSingle', 'in_', 'or', 'gte', 'lt', 'limit'];
  const c = { _mockResolve: { data: null, error: null }, then(fn) { return Promise.resolve(fn(this._mockResolve)); }, catch() { return Promise.resolve(); } };
  for (const m of methods) c[m] = jest.fn().mockReturnValue(c);
  return c;
}

beforeEach(() => {
  jest.clearAllMocks();
  supabase.from.mockImplementation(() => cloneChain());
});

describe('list', () => {
  it('returns active branches ordered by name', async () => {
    const mockBranches = [
      { id: 'b-1', name: 'Cabang A', is_active: true },
      { id: 'b-2', name: 'Cabang B', is_active: true },
    ];
    const chain = cloneChain();
    chain._mockResolve = { data: mockBranches, error: null };
    supabase.from.mockReturnValueOnce(chain);

    const result = await service.list();

    expect(supabase.from).toHaveBeenCalledWith('branches');
    expect(chain.select).toHaveBeenCalledWith('*');
    expect(chain.eq).toHaveBeenCalledWith('is_active', true);
    expect(chain.order).toHaveBeenCalledWith('name', { ascending: true });
    expect(result).toEqual(mockBranches);
  });

  it('throws when supabase query fails', async () => {
    const chain = cloneChain();
    chain._mockResolve = { data: null, error: new Error('connection error') };
    supabase.from.mockReturnValueOnce(chain);

    await expect(service.list()).rejects.toThrow('connection error');
  });

  it('returns empty array when no branches exist', async () => {
    const chain = cloneChain();
    chain._mockResolve = { data: [], error: null };
    supabase.from.mockReturnValueOnce(chain);

    const result = await service.list();

    expect(result).toEqual([]);
  });
});
