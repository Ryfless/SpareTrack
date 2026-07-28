import { describe, it, expect, vi, beforeEach } from 'vitest'
import { list, getById, create, update, exportCsv, bulkTransfer } from '../../app/services/inventory'
import { api } from '../../app/services/client'
import { supabase } from '../../app/services/supabase'

vi.mock('../../app/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}))

vi.mock('../../app/services/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

beforeEach(() => {
  vi.clearAllMocks()
})

describe('list', () => {
  it('calls api.get with query params', async () => {
    vi.mocked(api.get).mockResolvedValue({ success: true, data: [] } as any)
    await list({ page: 1, limit: 10, search: 'oil', status: 'low' })
    expect(api.get).toHaveBeenCalledWith('/inventory', { page: 1, limit: 10, search: 'oil', status: 'low' })
  })

  it('returns empty array on no results', async () => {
    vi.mocked(api.get).mockResolvedValue({ success: true, data: [] } as any)
    const result = await list()
    expect(result.data).toEqual([])
  })
})

describe('getById', () => {
  it('fetches single sparepart', async () => {
    const detail = { id: 'sp-1', name: 'Brake Pad' }
    vi.mocked(api.get).mockResolvedValue({ success: true, data: detail } as any)
    const result = await getById('sp-1')
    expect(api.get).toHaveBeenCalledWith('/inventory/sp-1')
    expect(result).toEqual(detail)
  })
})

describe('create', () => {
  it('posts new sparepart', async () => {
    const data = { code: 'BRK-01', name: 'Brake Pad', price: 50000 }
    vi.mocked(api.post).mockResolvedValue({ success: true, data: { id: 'new', ...data } } as any)
    const result = await create(data)
    expect(api.post).toHaveBeenCalledWith('/inventory', data)
    expect(result).toHaveProperty('id')
  })
})

describe('update', () => {
  it('patches sparepart', async () => {
    vi.mocked(api.patch).mockResolvedValue({ success: true, data: { id: 'sp-1', name: 'Updated' } } as any)
    const result = await update('sp-1', { name: 'Updated' })
    expect(api.patch).toHaveBeenCalledWith('/inventory/sp-1', { name: 'Updated' })
    expect(result.name).toBe('Updated')
  })
})

describe('exportCsv', () => {
  it('fetches CSV blob with auth token', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'tok-123' } } as any,
      error: null,
    } as any)
    mockFetch.mockResolvedValue({ ok: true, blob: vi.fn().mockResolvedValue(new Blob()) } as any)

    const blob = await exportCsv({ branch_id: 'b1' })

    const fetchUrl: string = mockFetch.mock.calls[0][0]
    expect(fetchUrl).toContain('/inventory/export/csv')
    expect(fetchUrl).toContain('branch_id=b1')
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer tok-123')
    expect(blob).toBeInstanceOf(Blob)
  })

  it('throws on failed export', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any)
    mockFetch.mockResolvedValue({ ok: false, json: vi.fn().mockResolvedValue({ message: 'Gagal export CSV' }) } as any)

    await expect(exportCsv()).rejects.toThrow('Gagal export CSV')
  })

  it('skips empty query params', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any)
    mockFetch.mockResolvedValue({ ok: true, blob: vi.fn().mockResolvedValue(new Blob()) } as any)

    await exportCsv()
    const url: string = mockFetch.mock.calls[0][0]
    expect(url).not.toContain('?')
  })

  it('omits "all" value params', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any)
    mockFetch.mockResolvedValue({ ok: true, blob: vi.fn().mockResolvedValue(new Blob()) } as any)

    await exportCsv({ status: 'all', branch_id: 'b1' } as any)
    const url: string = mockFetch.mock.calls[0][0]
    expect(url).toContain('branch_id=b1')
    expect(url).not.toContain('status')
  })
})

describe('bulkTransfer', () => {
  it('posts transfer data', async () => {
    const data = { items: [{ sparepart_id: 'sp-1', quantity: 5 }], source_branch_id: 'b1', destination_branch_id: 'b2' }
    vi.mocked(api.post).mockResolvedValue({ success: true, data: { items_transferred: 1, items: [] } } as any)
    const result = await bulkTransfer(data)
    expect(api.post).toHaveBeenCalledWith('/inventory/bulk/transfer', data)
    expect(result.items_transferred).toBe(1)
  })
})

describe('reports export', () => {
  it('exportPdf fetches blob with auth token', async () => {
    const { exportPdf } = await import('../../app/services/reports')
    const mockBlob = new Blob()
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, blob: vi.fn().mockResolvedValue(mockBlob) })
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: { access_token: 'tok' } as any }, error: null } as any)

    const blob = await exportPdf({ branch_id: 'b1', type: 'monthly' })
    expect(blob).toBe(mockBlob)
  })
})
