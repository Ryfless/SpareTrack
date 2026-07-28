import { describe, it, expect, vi, beforeEach } from 'vitest'
import { login, register, requestOtp, verifyOtp, signInWithGoogle, logout, getMe } from '../../app/services/auth'
import { supabase } from '../../app/services/supabase'
import { api } from '../../app/services/client'

vi.mock('../../app/services/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      verifyOtp: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

vi.mock('../../app/services/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(navigator, 'userAgent', { value: 'vitest', configurable: true })
  Object.defineProperty(window, 'location', { value: { origin: 'http://localhost', href: '' }, writable: true, configurable: true })
})

describe('login', () => {
  it('calls supabase signInWithPassword and records login history', async () => {
    const mockData = { user: { id: '1' }, session: { access_token: 't' } }
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: mockData, error: null } as any)
    vi.mocked(api.post).mockResolvedValue({ success: true, data: null } as any)

    const result = await login('a@b.com', 'secret')

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret' })
    expect(api.post).toHaveBeenCalledWith('/auth/login-history/login', expect.any(Object))
    expect(result).toEqual(mockData)
  })

  it('throws on supabase error', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: null, error: new Error('invalid') } as any)

    await expect(login('a@b.com', 'wrong')).rejects.toThrow('invalid')
  })

  it('still succeeds when login history log fails', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: { user: { id: '1' } }, error: null } as any)
    vi.mocked(api.post).mockRejectedValue(new Error('network'))

    await expect(login('a@b.com', 'p')).resolves.toBeDefined()
  })
})

describe('register', () => {
  it('calls supabase signUp with correct data', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({ data: { user: { id: '2' } }, error: null } as any)

    const result = await register({ email: 'b@b.com', password: 'pass', fullName: 'Bob', phone: '123', branch: 'b1' })

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'b@b.com',
      password: 'pass',
      options: {
        data: { full_name: 'Bob', phone: '123', branch: 'b1', role: 'branch_admin' },
      },
    })
    expect(result).toEqual({ user: { id: '2' } })
  })

  it('throws on error', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({ data: null, error: new Error('exists') } as any)
    await expect(register({ email: 'a@a.com', password: 'p', fullName: 'A' })).rejects.toThrow('exists')
  })
})

describe('requestOtp', () => {
  it('posts to otp endpoint', async () => {
    vi.mocked(api.post).mockResolvedValue({} as any)
    await requestOtp('a@b.com')
    expect(api.post).toHaveBeenCalledWith('/auth/otp/request', { email: 'a@b.com' })
  })
})

describe('verifyOtp', () => {
  it('calls supabase verifyOtp', async () => {
    vi.mocked(supabase.auth.verifyOtp).mockResolvedValue({ data: { user: { id: '1' } }, error: null } as any)
    const result = await verifyOtp('a@b.com', '123456')
    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({ email: 'a@b.com', token: '123456', type: 'email' })
    expect(result).toEqual({ user: { id: '1' } })
  })
})

describe('signInWithGoogle', () => {
  it('redirects on OAuth success', async () => {
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({ data: { url: 'https://accounts.google.com/...' }, error: null } as any)
    await signInWithGoogle()
    expect(window.location.href).toBe('https://accounts.google.com/...')
  })

  it('throws on error', async () => {
    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({ data: null, error: new Error('popup') } as any)
    await expect(signInWithGoogle()).rejects.toThrow('popup')
  })
})

describe('logout', () => {
  it('logs logout history and signs out', async () => {
    vi.mocked(api.post).mockResolvedValue({} as any)
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as any)
    await logout()
    expect(api.post).toHaveBeenCalledWith('/auth/login-history/logout')
    expect(supabase.auth.signOut).toHaveBeenCalled()
  })

  it('signs out even when history log fails', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('fail'))
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as any)
    await expect(logout()).resolves.toBeUndefined()
    expect(supabase.auth.signOut).toHaveBeenCalled()
  })
})

describe('getMe', () => {
  it('fetches current user', async () => {
    const userData = { user: { id: '1' }, profile: { id: '1', email: 'a@b.com', full_name: 'A', phone: '', branch: '', role: 'super_admin' } }
    vi.mocked(api.get).mockResolvedValue({ success: true, data: userData } as any)
    const result = await getMe()
    expect(api.get).toHaveBeenCalledWith('/me')
    expect(result).toEqual(userData)
  })
})
