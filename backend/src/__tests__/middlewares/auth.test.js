jest.mock('../../config/supabase');
jest.mock('../../utils/response', () => ({
  error: jest.fn((res, msg, _data, statusCode = 500) => res.status(statusCode).json({ error: msg })),
}));

const { supabase, supabaseAdmin } = require('../../config/supabase');
const { authenticate, authorize } = require('../../middlewares/auth');

function mockReq(headers = {}) {
  return { headers: { authorization: headers.authorization || '' }, user: {}, path: '/test' };
}
function mockRes() {
  const r = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('authenticate', () => {
  it('returns 401 when no auth header', async () => {
    const req = mockReq({});  
    const res = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when auth header is not Bearer', async () => {
    const req = mockReq({ authorization: 'Basic token' });
    const res = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when token is invalid', async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('invalid') });

    const req = mockReq({ authorization: 'Bearer bad-token' });
    const res = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('calls next with req.user when token is valid', async () => {
    const mockUser = { id: 'u-1', email: 'test@test.com' };
    supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    const req = mockReq({ authorization: 'Bearer valid-token' });
    const res = mockRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });
});

describe('authorize', () => {
  it('calls next when user has matching role', async () => {
    const req = { user: { id: 'u-1' }, path: '/test' };
    const res = mockRes();
    const next = jest.fn();

    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { role: 'super_admin' }, error: null }),
    };
    supabaseAdmin.from.mockReturnValue(chain);

    const mw = authorize('super_admin', 'admin');
    await mw(req, res, next);

    expect(req.userRole).toBe('super_admin');
    expect(next).toHaveBeenCalled();
  });

  it('returns 403 when user has insufficient role and resolveRole matches', async () => {
    const req = { user: { id: 'u-1' }, path: '/test' };
    const res = mockRes();
    const next = jest.fn();

    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { role: 'branch_admin' }, error: null }),
    };
    supabaseAdmin.from.mockReturnValue(chain);

    const mw = authorize('super_admin');
    await mw(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when resolveRole gives a matching role', async () => {
    const req = { user: { id: 'u-1' }, path: '/test' };
    const res = mockRes();
    const next = jest.fn();

    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
    };
    supabaseAdmin.from.mockReturnValue(chain);

    const mw = authorize('admin', 'super_admin');
    await mw(req, res, next);

    expect(req.userRole).toBe('admin');
    expect(next).toHaveBeenCalled();
  });
});
