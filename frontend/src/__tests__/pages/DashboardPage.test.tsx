import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { PageId } from '../../app/types'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="xaxis" />,
  YAxis: () => <div data-testid="yaxis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}))

const mockToast = vi.hoisted(() => {
  const t = vi.fn()
  t.success = vi.fn()
  t.error = vi.fn()
  return t
})
vi.mock('sonner', () => ({ toast: mockToast }))

const mockGetSummary = vi.fn()
const mockGetRecentActivity = vi.fn()
const mockGetDemandForecast = vi.fn()
const mockFetchBranches = vi.fn()
const mockGetStocks = vi.fn()
const mockGetLiveRecommendations = vi.fn()
const mockGetSalesTrend = vi.fn()

vi.mock('../../app/services/dashboard', () => ({
  getSummary: (...args: any[]) => mockGetSummary(...args),
  getRecentActivity: (...args: any[]) => mockGetRecentActivity(...args),
  getDemandForecast: (...args: any[]) => mockGetDemandForecast(...args),
}))

vi.mock('../../app/services/branches', () => ({
  list: (...args: any[]) => mockFetchBranches(...args),
  getStocks: (...args: any[]) => mockGetStocks(...args),
  getSalesTrend: (...args: any[]) => mockGetSalesTrend(...args),
}))

vi.mock('../../app/services/restock', () => ({
  getLiveRecommendations: (...args: any[]) => mockGetLiveRecommendations(...args),
}))

vi.mock('../../app/hooks/useAutoRefresh', () => ({
  useAutoRefresh: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

function mockLoaded() {
  mockGetSummary.mockResolvedValue({
    kpi: { total_spareparts: 50, total_branches: 3, total_stock: 485, total_value: 183000000, critical_stock: 5, low_stock: 8, overstock: 2, safe: 35, total_recommendations: 3 },
    recent_activity: [],
    monthly_trend: [],
    forecast_status: null,
  })
  mockGetRecentActivity.mockResolvedValue([
    { id: 'act-1', action: 'in', description: '5x Brake Pad masuk', created_at: new Date().toISOString() },
    { id: 'act-2', action: 'out', description: '2x Oil Filter keluar', created_at: new Date().toISOString() },
  ])
  mockFetchBranches.mockResolvedValue([
    { id: 'b1', name: 'Jakarta Pusat', code: 'JKT', address: '', city: 'Jakarta', phone: '', is_active: true, created_at: '' },
  ])
  mockGetStocks.mockResolvedValue({
    branch: { id: 'b1', name: 'Jakarta Pusat', code: 'JKT', address: '', city: 'Jakarta', phone: '', is_active: true, created_at: '' },
    stocks: [{ id: 's1', code: 'BRK', name: 'Brake', price: 50000, unit: 'pcs', category: 'Rem', quantity: 10, reorder_point: 5, safety_stock: 2, status: 'safe' }],
    total_value: 500000,
    monthly_sales: 100,
    top_selling: [],
  })
  mockGetLiveRecommendations.mockResolvedValue([
    { id: 'r1', sparepart_id: 'sp1', code: 'BRK', name: 'Brake Pad', price: 50000, unit: 'pcs', lead_time: 3, branch_id: 'b1', branch_name: 'Jakarta Pusat', supplier: 'A', current_stock: 2, reorder_point: 10, recommended_qty: 15, urgency: 'critical', status: 'pending', notes: '', postpone_reason: '', postpone_until: null, days_to_stockout: 4, created_at: '' },
  ])
  mockGetSalesTrend.mockResolvedValue([])
  mockGetDemandForecast.mockResolvedValue([])
}

function mockEmpty() {
  mockGetSummary.mockResolvedValue({
    kpi: { total_spareparts: 0, total_branches: 0, total_stock: 0, total_value: 0, critical_stock: 0, low_stock: 0, overstock: 0, safe: 0, total_recommendations: 0 },
    recent_activity: [],
    monthly_trend: [],
    forecast_status: null,
  })
  mockGetRecentActivity.mockResolvedValue([])
  mockFetchBranches.mockResolvedValue([])
  mockGetStocks.mockRejectedValue(new Error('fail'))
  mockGetLiveRecommendations.mockResolvedValue([])
  mockGetSalesTrend.mockResolvedValue([])
  mockGetDemandForecast.mockResolvedValue([])
}

async function renderDashboard() {
  const { DashboardPage } = await import('../../app/pages/app/DashboardPage')
  const onNavigate = vi.fn()
  const onAction = vi.fn()
  const view = render(<DashboardPage onNavigate={onNavigate} onAction={onAction} />)
  return { onNavigate, onAction, ...view }
}

describe('DashboardPage', () => {
  it('renders loading skeleton initially', async () => {
    mockGetSummary.mockReturnValue(new Promise(() => {}))
    mockGetRecentActivity.mockReturnValue(new Promise(() => {}))
    mockFetchBranches.mockReturnValue(new Promise(() => {}))
    const { container } = await renderDashboard()
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders KPI cards after data loads', async () => {
    mockLoaded()
    await renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('Total Sparepart')).toBeInTheDocument()
    })
    expect(screen.getByText('Nilai Stok')).toBeInTheDocument()
    expect(screen.getByText('Item Bermasalah')).toBeInTheDocument()
  })

  it('renders branch cards from data', async () => {
    mockLoaded()
    await renderDashboard()
    await waitFor(() => {
      const branchNames = screen.getAllByText('Jakarta Pusat')
      expect(branchNames.length).toBeGreaterThan(0)
    })
  })

  it('shows urgent restock items', async () => {
    mockLoaded()
    await renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('Brake Pad')).toBeInTheDocument()
    })
  })

  it('navigates on action alert click', async () => {
    mockLoaded()
    const { onNavigate } = await renderDashboard()
    await waitFor(() => {
      const els = screen.getAllByText('Stok Kritis')
      expect(els.length).toBeGreaterThan(0)
    })
    const user = userEvent.setup()
    const stokKritisButtons = screen.getAllByText('Stok Kritis')
    await user.click(stokKritisButtons[0].closest('button')!)
    expect(onNavigate).toHaveBeenCalled()
  })

  it('calls onAction for quick actions', async () => {
    mockLoaded()
    const { onAction } = await renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('Tambah Sparepart')).toBeInTheDocument()
    })
    const user = userEvent.setup()
    await user.click(screen.getByText('Tambah Sparepart'))
    expect(onAction).toHaveBeenCalledWith('add_item')
  })

  it('renders action center with critical count', async () => {
    mockLoaded()
    await renderDashboard()
    await waitFor(() => {
      const alerts = screen.getAllByText(/perlu perhatian/)
      expect(alerts.length).toBeGreaterThan(0)
    })
  })

  it('shows activity feed', async () => {
    mockLoaded()
    await renderDashboard()
    await waitFor(() => {
      expect(screen.getByText(/Brake Pad masuk/)).toBeInTheDocument()
    })
    expect(screen.getByText(/Oil Filter keluar/)).toBeInTheDocument()
  })

  it('handles empty activity state', async () => {
    mockEmpty()
    await renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('Belum ada aktivitas')).toBeInTheDocument()
    })
  })
})
