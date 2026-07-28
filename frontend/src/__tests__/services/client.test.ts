import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiRequest, api } from '../../app/services/client'
import { supabase } from '../../app/services/supabase'

vi.mock('../../app/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}))

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

beforeEach(() => {
  vi.clearAllMocks()
})

function mockToken(token: string | null) {
  vi.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session: token ? { access_token: token } as any : null },
    error: null,
  } as any)
}

function mockResponse(overrides: Partial<Response> = {}): Response {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue({ success: true, message: 'ok', data: null }),
    ...overrides,
  } as unknown as Response
}

describe('apiRequest', () => {
  it('sends GET with no token', async () => {
    mockToken(null)
    mockFetch.mockResolvedValue(mockResponse())

    await apiRequest('/test')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  })

  it('attaches Bearer token when available', async () => {
    mockToken('my-token')
    mockFetch.mockResolvedValue(mockResponse())

    await apiRequest('/secure')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer my-token' }),
      }),
    )
  })

  it('sends POST with JSON body', async () => {
    mockToken(null)
    mockFetch.mockResolvedValue(mockResponse())

    const body = { name: 'test' }
    await apiRequest('/create', { method: 'POST', body })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
      }),
    )
  })

  it('appends query params', async () => {
    mockToken(null)
    mockFetch.mockResolvedValue(mockResponse())

    await apiRequest('/search', { params: { q: 'hello', page: 1 } })

    const url: string = mockFetch.mock.calls[0][0]
    expect(url).toContain('q=hello')
    expect(url).toContain('page=1')
  })

  it('throws on non-ok response', async () => {
    mockToken(null)
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ success: false, message: 'Server error' }),
    } as unknown as Response)

    await expect(apiRequest('/fail')).rejects.toThrow('Server error')
  })

  it('returns parsed JSON on success', async () => {
    mockToken(null)
    const data = { id: 1, name: 'foo' }
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ success: true, message: 'ok', data }),
    } as unknown as Response)

    const result = await apiRequest('/data')
    expect(result.data).toEqual(data)
  })
})

describe('api convenience methods', () => {
  it('api.get calls apiRequest with GET', async () => {
    mockToken(null)
    mockFetch.mockResolvedValue(mockResponse())
    await api.get('/items', { page: '1' })
    expect(mockFetch.mock.calls[0][1].method).toBe('GET')
  })

  it('api.post calls apiRequest with POST', async () => {
    mockToken(null)
    mockFetch.mockResolvedValue(mockResponse())
    await api.post('/items', { name: 'x' })
    expect(mockFetch.mock.calls[0][1].method).toBe('POST')
  })

  it('api.patch calls apiRequest with PATCH', async () => {
    mockToken(null)
    mockFetch.mockResolvedValue(mockResponse())
    await api.patch('/items/1', { name: 'y' })
    expect(mockFetch.mock.calls[0][1].method).toBe('PATCH')
  })

  it('api.put calls apiRequest with PUT', async () => {
    mockToken(null)
    mockFetch.mockResolvedValue(mockResponse())
    await api.put('/items/1', { name: 'z' })
    expect(mockFetch.mock.calls[0][1].method).toBe('PUT')
  })

  it('api.delete calls apiRequest with DELETE', async () => {
    mockToken(null)
    mockFetch.mockResolvedValue(mockResponse())
    await api.delete('/items/1')
    expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
  })
})
