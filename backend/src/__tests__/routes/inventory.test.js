jest.mock('../../middlewares/auth');
jest.mock('../../config/supabase');

const request = require('supertest');
const app = require('../../app');
const { supabaseAdmin: supabase } = require('../../config/supabase');

function cloneChain() {
  const methods = ['select', 'eq', 'order', 'range', 'single', 'insert', 'update', 'maybeSingle', 'is', 'limit', 'or', 'ilike', 'in_', 'gte', 'lte', 'neq', 'textSearch'];
  const c = { _mockResolve: { data: null, error: null, count: 0 }, then(fn) { return Promise.resolve(fn(this._mockResolve)); }, catch() { return Promise.resolve(); } };
  for (const m of methods) c[m] = jest.fn().mockReturnValue(c);
  return c;
}

const mockSparepart = {
  id: 'sp-1', code: 'BRK-001', name: 'Brake Pad', price: 50000, unit: 'pcs', is_active: true,
  categories: { id: 'cat-1', name: 'Brake' },
  suppliers: { id: 'sup-1', name: 'Supplier A' },
};

beforeEach(() => {
  jest.clearAllMocks();
  supabase.from.mockImplementation(() => cloneChain());
});

describe('GET /api/v1/inventory', () => {
  it('returns 200 with paginated spareparts', async () => {
    supabase._mockResolve = { data: [mockSparepart], count: 1, error: null };

    const res = await request(app).get('/api/v1/inventory').query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body.meta).toBeDefined();
  });
});

describe('GET /api/v1/inventory/:id', () => {
  it('returns 200 with sparepart detail', async () => {
    const spChain = cloneChain();
    spChain.single.mockResolvedValue({ data: mockSparepart, error: null });
    supabase.from.mockReturnValueOnce(spChain);

    const res = await request(app).get('/api/v1/inventory/sp-1');

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('sp-1');
  });
});

describe('POST /api/v1/inventory', () => {
  it('returns 201 on successful creation', async () => {
    const chain = cloneChain();
    chain.single.mockResolvedValue({ data: mockSparepart, error: null });
    supabase.from.mockReturnValueOnce(chain);

    const res = await request(app)
      .post('/api/v1/inventory')
      .send({ code: 'BRK-001', name: 'Brake Pad', category_id: 'cat-1' });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe('sp-1');
  });

  it('returns 400 when required fields missing', async () => {
    const res = await request(app)
      .post('/api/v1/inventory')
      .send({ code: 'BRK-001' });

    expect(res.status).toBe(400);
  });
});
