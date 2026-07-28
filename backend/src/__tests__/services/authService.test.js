jest.mock('../../config/supabase');

const { supabaseAdmin, supabase } = require('../../config/supabase');
const authService = require('../../services/authService');

const mockUser = { id: 'user-1', email: 'test@test.com' };
const mockSession = { access_token: 'token', refresh_token: 'refresh' };
const mockProfile = { id: 'user-1', email: 'test@test.com', full_name: 'Test User', role: 'branch_admin' };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('registerUser', () => {
  it('creates user via supabase admin and inserts profile', async () => {
    supabaseAdmin.auth.admin.createUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    const result = await authService.registerUser('test@test.com', 'password123', { fullName: 'Test User' });

    expect(supabaseAdmin.auth.admin.createUser).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: expect.objectContaining({ full_name: 'Test User' }),
    });
    expect(supabaseAdmin.from).toHaveBeenCalledWith('profiles');
    expect(supabaseAdmin.insert).toHaveBeenCalledWith(expect.objectContaining({ full_name: 'Test User' }));
    expect(result).toEqual({ user: mockUser });
  });

  it('throws when createUser fails', async () => {
    const err = new Error('User already registered');
    supabaseAdmin.auth.admin.createUser.mockRejectedValue(err);

    await expect(authService.registerUser('test@test.com', 'password123', {}))
      .rejects.toThrow('User already registered');
  });
});

describe('loginUser', () => {
  it('returns session and user with profile on success', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null });
    supabaseAdmin.single.mockResolvedValue({ data: mockProfile, error: null });

    const result = await authService.loginUser('test@test.com', 'password123');

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123',
    });
    expect(supabaseAdmin.from).toHaveBeenCalledWith('profiles');
    expect(result).toEqual({ session: mockSession, user: { ...mockUser, profile: mockProfile } });
  });

  it('throws when credentials are invalid', async () => {
    const err = new Error('Invalid login credentials');
    supabase.auth.signInWithPassword.mockRejectedValue(err);

    await expect(authService.loginUser('wrong@test.com', 'wrong'))
      .rejects.toThrow('Invalid login credentials');
  });
});

describe('getProfile', () => {
  it('returns profile when found', async () => {
    supabaseAdmin.single.mockResolvedValue({ data: mockProfile, error: null });

    const result = await authService.getProfile('user-1');

    expect(supabaseAdmin.from).toHaveBeenCalledWith('profiles');
    expect(result).toEqual(mockProfile);
  });

  it('returns null when not found', async () => {
    supabaseAdmin.single.mockResolvedValue({ data: null, error: { message: 'not found' } });

    const result = await authService.getProfile('unknown');

    expect(result).toBeNull();
  });
});

describe('updateProfile', () => {
  it('updates profile and syncs metadata', async () => {
    supabaseAdmin.auth.admin.updateUserById.mockResolvedValue({ data: { user: mockUser }, error: null });
    supabaseAdmin.single.mockResolvedValue({ data: { ...mockProfile, full_name: 'Updated' }, error: null });

    const result = await authService.updateProfile('user-1', { full_name: 'Updated' });

    expect(supabaseAdmin.from).toHaveBeenCalledWith('profiles');
    expect(supabaseAdmin.update).toHaveBeenCalledWith(expect.objectContaining({ full_name: 'Updated' }));
    expect(supabaseAdmin.auth.admin.updateUserById).toHaveBeenCalledWith('user-1', expect.any(Object));
    expect(result.full_name).toBe('Updated');
  });
});
