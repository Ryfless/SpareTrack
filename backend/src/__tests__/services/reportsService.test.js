jest.mock('../../config/supabase');

const { supabaseAdmin: supabase } = require('../../config/supabase');
const service = require('../../services/reportsService');

function cloneChain() {
  const methods = ['select', 'eq', 'single', 'in', 'gte', 'lte', 'order', 'limit'];
  const c = { _mockResolve: { data: null, error: null }, then(fn) { return Promise.resolve(fn(this._mockResolve)); }, catch() { return Promise.resolve(); } };
  for (const m of methods) c[m] = jest.fn().mockReturnValue(c);
  return c;
}

beforeEach(() => {
  jest.clearAllMocks();
  supabase.from.mockImplementation(() => cloneChain());
});

describe('summary', () => {
  it('returns full report summary for a given period', async () => {
    const chains = Array.from({ length: 8 }, () => cloneChain());

    chains[0]._mockResolve = {
      data: [
        { type: 'in', quantity: 10, created_at: '2026-01-15', branch_id: 'b-1', sparepart_id: 'sp-1' },
        { type: 'out', quantity: 5, created_at: '2026-01-16', branch_id: 'b-1', sparepart_id: 'sp-1' },
      ],
      error: null,
    };

    chains[1]._mockResolve = { data: [{ id: 'sp-1', price: 100000 }], error: null };

    chains[2]._mockResolve = { data: null, count: 10, error: null };

    chains[3]._mockResolve = {
      data: [
        { quantity: 0, safety_stock: 5, reorder_point: 3, max_stock: 20, spareparts: { name: 'Sparepart A', code: 'SP-001' }, branches: { name: 'Cabang A' } },
        { quantity: 20, safety_stock: 5, reorder_point: 10, max_stock: 50, spareparts: { name: 'Sparepart B', code: 'SP-002' }, branches: { name: 'Cabang A' } },
      ],
      error: null,
    };

    chains[4]._mockResolve = { data: { name: 'Sparepart A' }, error: null };

    chains[5]._mockResolve = {
      data: [
        { sparepart_id: 'sp-1', branch_id: 'b-1', quantity: 0, safety_stock: 5, reorder_point: 3, max_stock: 20 },
      ],
      error: null,
    };

    chains[6]._mockResolve = {
      data: [
        { quantity: 0, safety_stock: 5, reorder_point: 3, max_stock: 20 },
        { quantity: 20, safety_stock: 5, reorder_point: 10, max_stock: 50 },
      ],
      error: null,
    };

    chains[7]._mockResolve = { data: [], error: null };

    for (const c of chains) supabase.from.mockReturnValueOnce(c);

    const result = await service.summary({ start_date: '2026-01-01', end_date: '2026-01-31' });

    expect(result.stock_movements.total_in).toBe(10);
    expect(result.stock_movements.total_out).toBe(5);
    expect(result.stock_movements.net_flow).toBe(5);
    expect(result.inventory.total_items).toBe(10);
    expect(result.inventory.critical_items).toBe(1);
    expect(result.inventory.critical_list[0].name).toBe('Sparepart A');
    expect(result.monthly_trend).toHaveLength(1);
    expect(result.monthly_trend[0].units).toBe(5);
    expect(result.monthly_trend[0].revenue).toBe(0.5);
    expect(result.top_sparepart.name).toBe('Sparepart A');
    expect(result.top_sparepart.total_sold).toBe(5);
    expect(result.stock_health).toHaveLength(1);
    expect(result.stock_health[0].critical).toBe(1);
    expect(result.stock_health[0].safe).toBe(0);
    expect(result.safe_stock_ratio.safe_count).toBe(1);
    expect(result.safe_stock_ratio.total_items).toBe(2);
    expect(result.safe_stock_ratio.ratio).toBe(50);
  });

  it('returns empty summary when no movements exist', async () => {
    const chains = Array.from({ length: 6 }, () => cloneChain());

    chains[0]._mockResolve = { data: [], error: null };
    chains[1]._mockResolve = { data: [], error: null };
    chains[2]._mockResolve = { data: null, count: 0, error: null };
    chains[3]._mockResolve = { data: [], error: null };
    chains[4]._mockResolve = { data: [], error: null };
    chains[5]._mockResolve = { data: [], error: null };

    for (const c of chains) supabase.from.mockReturnValueOnce(c);

    const result = await service.summary({ start_date: '2026-01-01', end_date: '2026-01-31' });

    expect(result.stock_movements.total_in).toBe(0);
    expect(result.stock_movements.total_out).toBe(0);
    expect(result.inventory.total_items).toBe(0);
    expect(result.inventory.critical_items).toBe(0);
    expect(result.monthly_trend).toEqual([]);
    expect(result.top_sparepart.name).toBe('');
  });

  it('filters by branch_id', async () => {
    const chains = Array.from({ length: 8 }, () => cloneChain());

    chains[0]._mockResolve = {
      data: [
        { type: 'in', quantity: 5, created_at: '2026-01-10', branch_id: 'b-1', sparepart_id: 'sp-1' },
        { type: 'out', quantity: 3, created_at: '2026-01-11', branch_id: 'b-1', sparepart_id: 'sp-1' },
      ],
      error: null,
    };
    chains[1]._mockResolve = { data: [{ id: 'sp-1', price: 50000 }], error: null };
    chains[2]._mockResolve = { data: null, count: 5, error: null };
    chains[3]._mockResolve = { data: [], error: null };
    chains[4]._mockResolve = { data: { name: 'Sparepart A' }, error: null };
    chains[5]._mockResolve = { data: [], error: null };
    chains[6]._mockResolve = { data: [], error: null };
    chains[7]._mockResolve = { data: [], error: null };

    for (const c of chains) supabase.from.mockReturnValueOnce(c);

    const result = await service.summary({ branch_id: 'b-1', start_date: '2026-01-01', end_date: '2026-01-31' });

    expect(result.stock_movements.total_in).toBe(5);
    expect(result.stock_movements.total_out).toBe(3);
    expect(chains[0].eq).toHaveBeenCalledWith('branch_id', 'b-1');
    expect(chains[2].eq).toHaveBeenCalledWith('branch_id', 'b-1');
  });
});
