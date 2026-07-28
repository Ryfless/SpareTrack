jest.mock('../../middlewares/auth');
jest.mock('../../config/supabase');

const request = require('supertest');
const app = require('../../app');
const { supabaseAdmin, supabase } = require('../../config/supabase');

const mockUser = { id: 'user-1', email: 'test@test.com' };
const mockSession = { access_token: 'token', refresh_token: 'refresh' };
const mockProfile = { id: 'user-1', email: 'test@test.com', full_name: 'Test User', role: 'super_admin' };

function cloneChain() {
  const methods = ['select', 'eq', 'order', 'range', 'single', 'insert', 'update', 'maybeSingle', 'is', 'limit', 'in_'];
  const c = { _mockResolve: { data: null, error: null }, then(fn) { return Promise.resolve(fn(this._mockResolve)); }, catch() { return Promise.resolve(); } };
  for (const m of methods) c[m] = jest.fn().mockReturnValue(c);
  return c;
}

beforeEach(() => {
  jest.clearAllMocks();
  supabaseAdmin.from.mockImplementation(() => cloneChain());
  supabase.from.mockImplementation(() => cloneChain());
});

describe('POST /api/v1/auth/register', () => {
  it('returns 201 on successful registration', async () => {
    supabaseAdmin.auth.admin.createUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    const chain = cloneChain();
    chain._mockResolve = { error: null };
    supabaseAdmin.from.mockReturnValueOnce(chain);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@test.com', password: 'password123', fullName: 'Test User' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toEqual(mockUser);
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@test.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 409 when email already exists', async () => {
    const err = new Error('duplicate key');
    err.status = 409;
    supabaseAdmin.auth.admin.createUser.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'dup@test.com', password: 'pass', fullName: 'Dup' });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('returns 200 with session and user profile', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null });
    const chain = cloneChain();
    chain._mockResolve = { data: mockProfile, error: null };
    supabaseAdmin.from.mockReturnValueOnce(chain);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.data.session).toEqual(mockSession);
  });

  it('returns 401 on invalid credentials', async () => {
    supabase.auth.signInWithPassword.mockRejectedValue(new Error('Invalid login credentials'));

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'wrong@test.com', password: 'wrong' });

    expect(res.status).toBe(500);
  });
});

describe('GET /api/v1/me', () => {
  it('returns 200 with user profile', async () => {
    const chain = cloneChain();
    chain.single.mockResolvedValue({ data: mockProfile, error: null });
    supabaseAdmin.from.mockReturnValueOnce(chain);

    const res = await request(app).get('/api/v1/me');

    expect(res.status).toBe(200);
    expect(res.body.data.profile).toEqual(mockProfile);
  });
});

describe('PATCH /api/v1/me', () => {
  it('returns 200 after profile update', async () => {
    supabaseAdmin.auth.admin.updateUserById.mockResolvedValue({ data: { user: mockUser }, error: null });

    const getProfileChain = cloneChain();
    getProfileChain.single.mockResolvedValue({ data: { ...mockProfile, full_name: 'Updated' }, error: null });

    supabaseAdmin.from
      .mockReturnValueOnce(cloneChain())
      .mockReturnValueOnce(getProfileChain);

    const res = await request(app)
      .patch('/api/v1/me')
      .send({ full_name: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.data.full_name).toBe('Updated');
  });
});
