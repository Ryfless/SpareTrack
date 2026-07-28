jest.mock('../../config/supabase');
jest.mock('../../services/notificationService');

const { supabaseAdmin: supabase } = require('../../config/supabase');
const inventoryService = require('../../services/inventoryService');

function cloneChain() {
  const methods = [
    'select', 'eq', 'neq', 'or', 'in_', 'order', 'limit', 'range',
    'single', 'maybeSingle', 'textSearch',
    'insert', 'update', 'delete', 'upsert',
    'is', 'not', 'gte', 'lt', 'lte', 'gt', 'ilike', 'like',
  ];
  const c = {
    _mockResolve: { data: null, error: null },
    then(onfulfill) { return Promise.resolve(onfulfill(this._mockResolve)); },
    catch() { return Promise.resolve(); },
  };
  for (const m of methods) c[m] = jest.fn().mockReturnValue(c);
  return c;
}

const mockSparepart = {
  id: 'sp-1', code: 'BRK-001', name: 'Brake Pad', price: 50000, unit: 'pcs',
  categories: { id: 'cat-1', name: 'Brake' },
  suppliers: { id: 'sup-1', name: 'Supplier A' },
  is_active: true,
};

beforeEach(() => {
  jest.clearAllMocks();
  supabase.from.mockImplementation(() => cloneChain());
});

describe('create', () => {
  it('inserts a new sparepart and returns it', async () => {
    const chain = cloneChain();
    chain.single.mockResolvedValue({ data: mockSparepart, error: null });
    supabase.from.mockReturnValueOnce(chain);

    const result = await inventoryService.create({
      code: 'BRK-001', name: 'Brake Pad', category_id: 'cat-1', supplier_id: 'sup-1', price: 50000,
    });

    expect(supabase.from).toHaveBeenCalledWith('spareparts');
    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ code: 'BRK-001', name: 'Brake Pad' }));
    expect(result).toEqual(mockSparepart);
  });

  it('throws 400 when code is missing', async () => {
    await expect(inventoryService.create({ name: 'No Code' })).rejects.toThrow('code dan name wajib diisi');
    await expect(inventoryService.create({ code: '', name: 'Empty Code' })).rejects.toThrow('code dan name wajib diisi');
  });

  it('throws 409 on duplicate code', async () => {
    const chain = cloneChain();
    chain.single.mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate key' } });
    supabase.from.mockReturnValueOnce(chain);

    await expect(inventoryService.create({ code: 'EXIST', name: 'Exists' })).rejects.toThrow('Kode sparepart sudah ada');
  });
});

describe('detail', () => {
  it('returns sparepart with movements and stock', async () => {
    const mockMovements = [{ id: 'm-1', type: 'in', quantity: 10, notes: 'restock', profiles: { full_name: 'Admin' }, created_at: '2026-01-01' }];
    const mockBranchStocks = [{ quantity: 10, safety_stock: 5, reorder_point: 8, max_stock: 50, min_stock: 2, branches: { id: 'b-1', name: 'Cabang A' } }];

    const spChain = cloneChain();
    spChain.single.mockResolvedValue({ data: mockSparepart, error: null });

    const movChain = cloneChain();
    movChain._mockResolve = { data: mockMovements, error: null };

    const bsChain = cloneChain();
    bsChain._mockResolve = { data: mockBranchStocks, error: null };

    supabase.from
      .mockReturnValueOnce(spChain)
      .mockReturnValueOnce(movChain)
      .mockReturnValueOnce(bsChain);

    const result = await inventoryService.detail('sp-1');

    expect(result.id).toBe('sp-1');
    expect(result.recent_movements).toHaveLength(1);
    expect(result.stock_by_branch).toHaveLength(1);
    expect(result.total_stock).toBe(10);
  });

  it('returns null when sparepart not found', async () => {
    const spChain = cloneChain();
    spChain.single.mockResolvedValue({ data: null, error: { message: 'not found' } });
    supabase.from.mockReturnValueOnce(spChain);

    const result = await inventoryService.detail('unknown');

    expect(result).toBeNull();
  });
});

describe('adjustStock', () => {
  const mockMovement = { id: 'mov-1', type: 'adjustment', sparepart_id: 'sp-1', branch_id: 'b-1', quantity: 5, notes: 'opname' };
  const userId = 'user-1';

  it('creates movement and activity log', async () => {
    const spChain = cloneChain();
    spChain.single.mockResolvedValue({ data: { id: 'sp-1', name: 'Brake Pad' }, error: null });

    const brChain = cloneChain();
    brChain.single.mockResolvedValue({ data: { id: 'b-1' }, error: null });

    const movChain = cloneChain();
    movChain.single.mockResolvedValue({ data: mockMovement, error: null });

    const actChain = cloneChain();
    actChain._mockResolve = { error: null };

    supabase.from
      .mockReturnValueOnce(spChain)
      .mockReturnValueOnce(brChain)
      .mockReturnValueOnce(movChain)
      .mockReturnValueOnce(actChain);

    const result = await inventoryService.adjustStock('sp-1', { branch_id: 'b-1', quantity: 5, notes: 'opname' }, userId);

    expect(result).toEqual(mockMovement);
    expect(movChain.insert).toHaveBeenCalledWith(expect.objectContaining({ type: 'adjustment', quantity: 5 }));
    expect(actChain.insert).toHaveBeenCalledWith(expect.objectContaining({ action: 'adjustment' }));
  });

  it('throws 404 when sparepart not found', async () => {
    const chain = cloneChain();
    chain.single.mockResolvedValue({ data: null, error: { message: 'not found' } });
    supabase.from.mockReturnValueOnce(chain);

    await expect(inventoryService.adjustStock('bad-id', { branch_id: 'b-1', quantity: 5 }, 'user-1'))
      .rejects.toThrow('Sparepart tidak ditemukan');
  });
});
