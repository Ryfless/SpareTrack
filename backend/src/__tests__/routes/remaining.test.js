jest.mock('../../middlewares/auth');
jest.mock('../../config/supabase');

const request = require('supertest');
const app = require('../../app');
const { supabaseAdmin: supabase } = require('../../config/supabase');

function cloneChain() {
  const allMethods = [
    'select', 'eq', 'neq', 'in', 'or', 'order', 'limit', 'range',
    'single', 'maybeSingle', 'textSearch',
    'insert', 'update', 'delete', 'upsert',
    'is', 'not', 'gte', 'lt', 'lte', 'gt', 'ilike', 'like',
  ];
  const c = {
    _mockResolve: { data: null, error: null, count: 0 },
    then(fn) { return Promise.resolve(fn(this._mockResolve)); },
    catch() { return Promise.resolve(); },
  };
  for (const m of allMethods) c[m] = jest.fn().mockReturnValue(c);
  return c;
}

beforeEach(() => {
  jest.clearAllMocks();
  supabase.from.mockImplementation(() => cloneChain());
  supabase.auth.admin.getUserById = jest.fn();
});

describe('GET /api/v1/dashboard/summary', () => {
  it('returns 200 with KPI summary', async () => {
    supabase.auth.admin.getUserById.mockResolvedValue({
      data: { user: { user_metadata: { role: 'super_admin' } } },
    });

    const res = await request(app).get('/api/v1/dashboard/summary');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });
});

describe('GET /api/v1/branches', () => {
  it('returns 200 with branch list', async () => {
    const chain = cloneChain();
    chain._mockResolve = { data: [{ id: 'b-1', name: 'Cabang A', is_active: true }], error: null };
    supabase.from.mockReturnValueOnce(chain);

    const res = await request(app).get('/api/v1/branches');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /api/v1/users', () => {
  it('returns 200 with paginated users', async () => {
    supabase._mockResolve = { data: [{ id: 'u-1', email: 'test@test.com' }], count: 1, error: null };

    const res = await request(app).get('/api/v1/users');

    expect(res.status).toBe(200);
    expect(res.body.meta).toBeDefined();
  });
});

describe('GET /api/v1/settings', () => {
  it('returns 200 with settings', async () => {
    supabase.maybeSingle.mockResolvedValue({ data: { role: 'super_admin' }, error: null });

    const res = await request(app).get('/api/v1/settings');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });
});

describe('POST /api/v1/transactions', () => {
  it('returns 201 on successful creation', async () => {
    const spChain = cloneChain();
    spChain.single.mockResolvedValue({ data: { id: 'sp-1', name: 'Brake Pad' }, error: null });

    const brChain = cloneChain();
    brChain.single.mockResolvedValue({ data: { id: 'b-1' }, error: null });

    const movChain = cloneChain();
    movChain.single.mockResolvedValue({ data: { id: 'mov-1', type: 'in', quantity: 5 }, error: null });

    supabase.from
      .mockReturnValueOnce(spChain)
      .mockReturnValueOnce(brChain)
      .mockReturnValueOnce(movChain)
      .mockReturnValueOnce(cloneChain());

    const res = await request(app)
      .post('/api/v1/transactions')
      .send({ type: 'in', sparepart_id: 'sp-1', branch_id: 'b-1', quantity: 5 });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe('mov-1');
  });
});

describe('GET /api/v1/notifications', () => {
  it('returns 200 with paginated notifications', async () => {
    const chain = cloneChain();
    chain._mockResolve = { data: [{ id: 'n-1' }], count: 1, error: null };
    supabase.from.mockReturnValueOnce(chain);

    const res = await request(app).get('/api/v1/notifications');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('PATCH /api/v1/notifications/read-all', () => {
  it('returns 200 after marking all as read', async () => {
    supabase._mockResolve = { error: null };

    const res = await request(app).patch('/api/v1/notifications/read-all');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/v1/audit-logs', () => {
  it('returns 200 with paginated audit logs', async () => {
    const chain = cloneChain();
    chain._mockResolve = { data: [{ id: 'al-1', profiles: { full_name: 'Admin', email: 'admin@test.com' } }], count: 1, error: null };
    supabase.from.mockReturnValueOnce(chain);

    const res = await request(app).get('/api/v1/audit-logs');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /api/v1/reports/summary', () => {
  it('returns 200 with report summary', async () => {
    const chain = cloneChain();
    chain._mockResolve = { data: [], count: 0, error: null };
    supabase.from.mockReturnValueOnce(chain);

    const res = await request(app).get('/api/v1/reports/summary');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });
});

describe('GET /api/v1/restock/summary', () => {
  it('returns 200 with restock summary', async () => {
    const chain = cloneChain();
    chain._mockResolve = { data: [], count: 0, error: null };
    supabase.from.mockReturnValueOnce(chain);

    const res = await request(app).get('/api/v1/restock/summary');

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });
});
