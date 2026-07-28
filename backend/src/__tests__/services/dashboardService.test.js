jest.mock('../../config/supabase');
jest.mock('../../services/inventoryService');

const { supabaseAdmin: supabase } = require('../../config/supabase');
const inventoryService = require('../../services/inventoryService');
const service = require('../../services/dashboardService');

function cloneChain() {
  const methods = ['select', 'eq', 'single', 'order', 'limit', 'gte', 'lt', 'is', 'neq'];
  const c = { _mockResolve: { data: null, error: null }, then(fn) { return Promise.resolve(fn(this._mockResolve)); }, catch() { return Promise.resolve(); } };
  for (const m of methods) c[m] = jest.fn().mockReturnValue(c);
  return c;
}

beforeEach(() => {
  jest.clearAllMocks();
  supabase.auth.admin.getUserById = jest.fn();
  supabase.from.mockImplementation(() => cloneChain());
});

describe('getSummary', () => {
  it('returns KPI summary for super_admin', async () => {
    supabase.auth.admin.getUserById.mockResolvedValue({
      data: { user: { user_metadata: { role: 'super_admin', branch: '' } } },
      error: null,
    });

    const chains = Array.from({ length: 8 }, () => cloneChain());
    chains[0]._mockResolve = { data: null, count: 100, error: null };
    chains[1]._mockResolve = { data: null, count: 5, error: null };
    chains[2]._mockResolve = { data: [{ id: 'sp-1', price: 50000 }], error: null };
    chains[3]._mockResolve = { data: [{ quantity: 10, safety_stock: 5, reorder_point: 8, max_stock: 50, min_stock: 2, sparepart_id: 'sp-1' }], error: null };
    chains[4]._mockResolve = { data: null, count: 3, error: null };
    chains[5]._mockResolve = { data: [{ id: 'a-1', action: 'create', description: 'test', entity_type: 'sparepart', created_at: '2026-07-01' }], error: null };
    chains[6]._mockResolve = { data: [{ created_at: '2026-07-01', quantity: 5, type: 'out', branch_id: 'b-1' }], error: null };
    chains[7]._mockResolve = { data: [{ id: 'f-1', status: 'completed', created_at: '2026-07-01' }], error: null };

    for (const c of chains) supabase.from.mockReturnValueOnce(c);

    inventoryService.computeStatusCounts.mockResolvedValue({ critical: 2, low: 3, overstock: 1, safe: 94 });

    const result = await service.getSummary('super-admin-1');

    expect(result.kpi.total_spareparts).toBe(100);
    expect(result.kpi.total_branches).toBe(5);
    expect(result.kpi.total_stock).toBe(10);
    expect(result.kpi.total_value).toBe(500000);
    expect(result.kpi.critical_stock).toBe(2);
    expect(result.kpi.low_stock).toBe(3);
    expect(result.kpi.overstock).toBe(1);
    expect(result.kpi.safe).toBe(94);
    expect(result.kpi.total_recommendations).toBe(3);
    expect(result.recent_activity).toHaveLength(1);
    expect(result.monthly_trend).toHaveLength(1);
    expect(result.forecast_status).toBe('completed');
  });

  it('returns KPI summary for branch_admin with branch filter', async () => {
    supabase.auth.admin.getUserById.mockResolvedValue({
      data: { user: { user_metadata: { role: 'branch_admin', branch: 'Cabang A' } } },
      error: null,
    });

    const chains = Array.from({ length: 9 }, () => cloneChain());
    chains[0]._mockResolve = { data: { id: 'b-1' }, error: null };
    chains[1]._mockResolve = { data: null, count: 50, error: null };
    chains[2]._mockResolve = { data: null, count: 3, error: null };
    chains[3]._mockResolve = { data: [{ id: 'sp-1', price: 25000 }], error: null };
    chains[4]._mockResolve = { data: [{ quantity: 20, safety_stock: 5, reorder_point: 10, max_stock: 100, min_stock: 2, sparepart_id: 'sp-1' }], error: null };
    chains[5]._mockResolve = { data: null, count: 1, error: null };
    chains[6]._mockResolve = { data: [], error: null };
    chains[7]._mockResolve = { data: [], error: null };
    chains[8]._mockResolve = { data: [], error: null };

    for (const c of chains) supabase.from.mockReturnValueOnce(c);

    inventoryService.computeStatusCounts.mockResolvedValue({ critical: 1, low: 0, overstock: 0, safe: 49 });

    const result = await service.getSummary('branch-admin-1');

    expect(result.kpi.total_spareparts).toBe(50);
    expect(result.kpi.total_branches).toBe(3);
    expect(result.kpi.critical_stock).toBe(1);
    expect(result.forecast_status).toBeNull();
    expect(chains[4].eq).toHaveBeenCalledWith('branch_id', 'b-1');
  });
});
