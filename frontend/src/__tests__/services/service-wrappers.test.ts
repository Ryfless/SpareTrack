import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from '../../app/services/client'

vi.mock('../../app/services/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

function mockGet<T>(data: T) {
  vi.mocked(api.get).mockResolvedValue({ success: true, data } as any)
}

function mockPost<T>(data: T) {
  vi.mocked(api.post).mockResolvedValue({ success: true, data } as any)
}

function mockPatch<T>(data: T) {
  vi.mocked(api.patch).mockResolvedValue({ success: true, data } as any)
}

beforeEach(() => { vi.clearAllMocks() })

describe('dashboard', () => {
  it('getSummary', async () => {
    const { getSummary } = await import('../../app/services/dashboard')
    mockGet({ kpi: { total_spareparts: 100 } })
    const result = await getSummary()
    expect(api.get).toHaveBeenCalledWith('/dashboard/summary')
    expect(result.kpi.total_spareparts).toBe(100)
  })

  it('getDemandForecast', async () => {
    const { getDemandForecast } = await import('../../app/services/dashboard')
    mockGet([{ month: 'Jan', actual: 10, predicted: 15 }])
    const result = await getDemandForecast()
    expect(api.get).toHaveBeenCalledWith('/dashboard/demand-forecast')
    expect(result).toHaveLength(1)
  })

  it('getRecentActivity', async () => {
    const { getRecentActivity } = await import('../../app/services/dashboard')
    mockGet([{ id: 'a1', action: 'create' }])
    const result = await getRecentActivity()
    expect(api.get).toHaveBeenCalledWith('/dashboard/recent-activity')
    expect(result[0].action).toBe('create')
  })
})

describe('branches', () => {
  it('list', async () => {
    const { list } = await import('../../app/services/branches')
    mockGet([{ id: 'b1', name: 'Jakarta' }])
    const result = await list()
    expect(api.get).toHaveBeenCalledWith('/branches')
    expect(result[0].name).toBe('Jakarta')
  })

  it('getStocks', async () => {
    const { getStocks } = await import('../../app/services/branches')
    mockGet({ branch: { id: 'b1' }, stocks: [] })
    await getStocks('b1', { search: 'oil' })
    expect(api.get).toHaveBeenCalledWith('/branches/b1/stocks', { search: 'oil' })
  })

  it('getSalesTrend', async () => {
    const { getSalesTrend } = await import('../../app/services/branches')
    mockGet([{ month_key: '2026-01', month_label: 'Jan 2026', top_branches: [] }])
    await getSalesTrend()
    expect(api.get).toHaveBeenCalledWith('/branches/sales-trend')
  })
})

describe('transactions', () => {
  it('list', async () => {
    const { list } = await import('../../app/services/transactions')
    mockGet({ data: [], meta: {} })
    await list({ page: 1, type: 'in' })
    expect(api.get).toHaveBeenCalledWith('/transactions', { page: 1, type: 'in' })
  })

  it('create', async () => {
    const { create } = await import('../../app/services/transactions')
    const input = { type: 'in' as const, sparepart_id: 'sp-1', branch_id: 'b1', quantity: 10 }
    mockPost({ id: 't1', ...input })
    const result = await create(input)
    expect(api.post).toHaveBeenCalledWith('/transactions', input)
    expect(result.id).toBe('t1')
  })
})

describe('users', () => {
  it('getUsers', async () => {
    const { getUsers } = await import('../../app/services/users')
    mockGet({ data: [], meta: {} })
    await getUsers({ page: 1 })
    expect(api.get).toHaveBeenCalledWith('/users', { page: 1 })
  })

  it('getUser', async () => {
    const { getUser } = await import('../../app/services/users')
    mockGet({ id: 'u1', email: 'a@b.com' })
    const result = await getUser('u1')
    expect(api.get).toHaveBeenCalledWith('/users/u1')
    expect(result.email).toBe('a@b.com')
  })

  it('createUser', async () => {
    const { createUser } = await import('../../app/services/users')
    const input = { email: 'new@b.com', full_name: 'New', password: 'p' }
    mockPost({ id: 'u2', ...input })
    const result = await createUser(input as any)
    expect(api.post).toHaveBeenCalledWith('/users', input)
    expect(result.id).toBe('u2')
  })

  it('updateUser', async () => {
    const { updateUser } = await import('../../app/services/users')
    mockPatch({ id: 'u1', full_name: 'Updated' })
    const result = await updateUser('u1', { full_name: 'Updated' })
    expect(api.patch).toHaveBeenCalledWith('/users/u1', { full_name: 'Updated' })
    expect(result.full_name).toBe('Updated')
  })

  it('toggleUserActive', async () => {
    const { toggleUserActive } = await import('../../app/services/users')
    mockPatch({ id: 'u1', is_active: false })
    const result = await toggleUserActive('u1')
    expect(api.patch).toHaveBeenCalledWith('/users/u1/toggle')
    expect(result.is_active).toBe(false)
  })
})

describe('settings', () => {
  it('getSettings', async () => {
    const { getSettings } = await import('../../app/services/settings')
    mockGet({ profile: { id: 'u1' }, branches: [], settings: {}, api_tokens: [] })
    const result = await getSettings()
    expect(api.get).toHaveBeenCalledWith('/settings')
    expect(result.profile.id).toBe('u1')
  })

  it('updateSettings', async () => {
    const { updateSettings } = await import('../../app/services/settings')
    mockPatch({ success: true })
    await updateSettings({ key: 'theme', value: 'dark' })
    expect(api.patch).toHaveBeenCalledWith('/settings', { key: 'theme', value: 'dark' })
  })
})

describe('notifications', () => {
  it('list', async () => {
    const { list } = await import('../../app/services/notifications')
    mockGet({ data: [], meta: {} })
    await list(1, 10)
    expect(api.get).toHaveBeenCalledWith('/notifications', { page: 1, limit: 10 })
  })

  it('getUnreadCount', async () => {
    const { getUnreadCount } = await import('../../app/services/notifications')
    mockGet({ count: 5 })
    const result = await getUnreadCount()
    expect(api.get).toHaveBeenCalledWith('/notifications/unread-count')
    expect(result.count).toBe(5)
  })

  it('markRead', async () => {
    const { markRead } = await import('../../app/services/notifications')
    mockPatch({ id: 'n1', is_read: true })
    const result = await markRead('n1')
    expect(api.patch).toHaveBeenCalledWith('/notifications/n1/read')
    expect(result.is_read).toBe(true)
  })

  it('markAllRead', async () => {
    const { markAllRead } = await import('../../app/services/notifications')
    await markAllRead()
    expect(api.patch).toHaveBeenCalledWith('/notifications/read-all')
  })
})

describe('reports', () => {
  it('getSummary', async () => {
    const { getSummary } = await import('../../app/services/reports')
    mockGet({ period: { start: '2026-01', end: '2026-06' }, stock_movements: { total_in: 100, total_out: 50, total_adjustment: 0, total_transfer: 10, net_flow: 50 }, inventory: { total_items: 200, critical_items: 5, critical_list: [] }, monthly_trend: [], top_sparepart: { name: 'X', total_sold: 30, avg_monthly: 5 }, stock_health: [], safe_stock_ratio: { ratio: 0.8, safe_count: 160, total_items: 200 } })
    const result = await getSummary({ branch_id: 'b1' })
    expect(api.get).toHaveBeenCalledWith('/reports/summary', { branch_id: 'b1' })
    expect(result.period.start).toBe('2026-01')
  })

})

describe('loginHistory', () => {
  it('getLoginHistory', async () => {
    const { getLoginHistory } = await import('../../app/services/loginHistory')
    mockGet([{ id: 'h1', user_id: 'u1' }])
    const result = await getLoginHistory()
    expect(api.get).toHaveBeenCalledWith('/auth/login-history')
    expect(result[0].id).toBe('h1')
  })
})

describe('auditLog', () => {
  it('getAuditLogs', async () => {
    const { getAuditLogs } = await import('../../app/services/auditLog')
    mockGet({ data: [], meta: {} })
    await getAuditLogs({ page: 1 })
    expect(api.get).toHaveBeenCalledWith('/audit-logs', { page: 1 })
  })

  it('getAuditLogDetail', async () => {
    const { getAuditLogDetail } = await import('../../app/services/auditLog')
    mockGet({ id: 'a1', action: 'delete' })
    const result = await getAuditLogDetail('a1')
    expect(api.get).toHaveBeenCalledWith('/audit-logs/a1')
    expect(result.action).toBe('delete')
  })
})

describe('references', () => {
  it('getCategories', async () => {
    const { getCategories } = await import('../../app/services/references')
    mockGet([{ id: 'c1', name: 'Engine' }])
    const result = await getCategories()
    expect(api.get).toHaveBeenCalledWith('/categories')
    expect(result[0].name).toBe('Engine')
  })

  it('getSuppliers', async () => {
    const { getSuppliers } = await import('../../app/services/references')
    mockGet([{ id: 's1', name: 'Toyota' }])
    const result = await getSuppliers()
    expect(api.get).toHaveBeenCalledWith('/suppliers')
    expect(result[0].name).toBe('Toyota')
  })
})

describe('restock', () => {
  it('getLiveRecommendations', async () => {
    const { getLiveRecommendations } = await import('../../app/services/restock')
    mockGet([{ id: 'r1', name: 'Brake' }])
    await getLiveRecommendations({ branch_id: 'b1' })
    expect(api.get).toHaveBeenCalledWith('/restock/live-recommendations', { branch_id: 'b1' })
  })

  it('getRecommendations', async () => {
    const { getRecommendations } = await import('../../app/services/restock')
    mockGet([{ id: 'r1' }])
    await getRecommendations({ status: 'pending' })
    expect(api.get).toHaveBeenCalledWith('/restock/recommendations', { status: 'pending' })
  })

  it('postponeRecommendation', async () => {
    const { postponeRecommendation } = await import('../../app/services/restock')
    mockPost({ id: 'r1', postpone_reason: 'waiting' })
    const result = await postponeRecommendation('r1', 'waiting', '2026-08-01')
    expect(api.post).toHaveBeenCalledWith('/restock/recommendations/r1/postpone', { postpone_reason: 'waiting', postpone_until: '2026-08-01' })
    expect(result.id).toBe('r1')
  })

  it('getPurchaseOrders', async () => {
    const { getPurchaseOrders } = await import('../../app/services/restock')
    mockGet({ data: [], meta: {} })
    await getPurchaseOrders({ page: 1 })
    expect(api.get).toHaveBeenCalledWith('/restock/purchase-orders', { page: 1 })
  })

  it('createPurchaseOrder', async () => {
    const { createPurchaseOrder } = await import('../../app/services/restock')
    const input = { supplier_id: 's1', branch_id: 'b1' }
    mockPost({ id: 'po1', po_number: 'PO-001' })
    const result = await createPurchaseOrder(input)
    expect(api.post).toHaveBeenCalledWith('/restock/purchase-orders', input)
    expect(result.po_number).toBe('PO-001')
  })

  it('generateRecommendations', async () => {
    const { generateRecommendations } = await import('../../app/services/restock')
    mockPost([{ id: 'r-gen1' }])
    const result = await generateRecommendations()
    expect(api.post).toHaveBeenCalledWith('/restock/recommendations/generate')
    expect(result).toHaveLength(1)
  })

  it('getPurchaseOrderDetail', async () => {
    const { getPurchaseOrderDetail } = await import('../../app/services/restock')
    mockGet({ id: 'po1', items: [] })
    const result = await getPurchaseOrderDetail('po1')
    expect(api.get).toHaveBeenCalledWith('/restock/purchase-orders/po1')
    expect(result.items).toEqual([])
  })

  it('approvePurchaseOrder', async () => {
    const { approvePurchaseOrder } = await import('../../app/services/restock')
    mockPost({ status: 'approved' })
    const result = await approvePurchaseOrder('po1')
    expect(api.post).toHaveBeenCalledWith('/restock/purchase-orders/po1/approve')
    expect(result.status).toBe('approved')
  })

  it('receivePurchaseOrder', async () => {
    const { receivePurchaseOrder } = await import('../../app/services/restock')
    mockPost({ status: 'received', items_processed: 3 })
    const result = await receivePurchaseOrder('po1')
    expect(api.post).toHaveBeenCalledWith('/restock/purchase-orders/po1/receive')
    expect(result.items_processed).toBe(3)
  })

  it('cancelPurchaseOrder', async () => {
    const { cancelPurchaseOrder } = await import('../../app/services/restock')
    vi.mocked(api.delete).mockResolvedValue({ success: true, data: { status: 'cancelled' } } as any)
    const result = await cancelPurchaseOrder('po1')
    expect(api.delete).toHaveBeenCalledWith('/restock/purchase-orders/po1')
    expect(result.status).toBe('cancelled')
  })
})
