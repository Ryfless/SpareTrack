import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockToast = vi.hoisted(() => {
  const t = vi.fn()
  t.success = vi.fn()
  t.error = vi.fn()
  return t
})
vi.mock('sonner', () => ({ toast: mockToast }))

const mockFetchInventory = vi.fn()
const mockExportCsv = vi.fn()
const mockGetBranches = vi.fn()
const mockGetCategories = vi.fn()
const mockGetSuppliers = vi.fn()

vi.mock('../../app/services/inventory', () => ({
  list: (...args: any[]) => mockFetchInventory(...args),
  exportCsv: (...args: any[]) => mockExportCsv(...args),
}))

vi.mock('../../app/services/branches', () => ({
  list: (...args: any[]) => mockGetBranches(...args),
}))

vi.mock('../../app/services/references', () => ({
  getCategories: (...args: any[]) => mockGetCategories(...args),
  getSuppliers: (...args: any[]) => mockGetSuppliers(...args),
}))

vi.mock('../../app/hooks/useAutoRefresh', () => ({
  useAutoRefresh: vi.fn(),
}))

vi.mock('../../app/components/modals/EditItemModal', () => ({
  EditItemModal: ({ open }: any) => open ? <div data-testid="edit-modal" /> : null,
}))

vi.mock('../../app/components/modals/BulkTransferModal', () => ({
  BulkTransferModal: ({ open }: any) => open ? <div data-testid="bulk-transfer-modal" /> : null,
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockGetBranches.mockResolvedValue([
    { id: 'b1', name: 'Jakarta', code: 'JKT', address: '', city: 'Jakarta', phone: '', is_active: true, created_at: '' },
    { id: 'b2', name: 'Bandung', code: 'BDG', address: '', city: 'Bandung', phone: '', is_active: true, created_at: '' },
  ])
  mockGetCategories.mockResolvedValue([{ id: 'c1', name: 'Rem' }, { id: 'c2', name: 'Mesin' }])
  mockGetSuppliers.mockResolvedValue([{ id: 's1', name: 'Toyota' }])
})

function makeItem(overrides: any = {}): any {
  return {
    id: 'sp-1', code: 'BRK-01', name: 'Brake Pad', category: 'Rem', supplier: 'Toyota',
    price: 50000, lead_time: 3, unit: 'pcs', is_active: true,
    total_stock: 25, status: 'safe',
    stock_by_branch: [
      { branch_id: 'b1', branch_name: 'Jakarta', quantity: 15, reorder_point: 10, max_stock: 50 },
      { branch_id: 'b2', branch_name: 'Bandung', quantity: 10, reorder_point: 8, max_stock: 40 },
    ],
    created_at: '',
    ...overrides,
  }
}

function mockInventoryResult(items: any[] = [makeItem()]) {
  mockFetchInventory.mockResolvedValue({
    success: true,
    data: items,
    meta: { page: 1, limit: 20, total: items.length, total_pages: Math.ceil(items.length / 20), counts: { total: items.length, safe: items.filter((i: any) => i.status === 'safe').length, low: 0, critical: 0, overstock: 0 } },
  })
}

async function renderInventoryPage(props: any = {}) {
  const { InventoryPage } = await import('../../app/pages/app/InventoryPage')
  const onSelectPart = vi.fn()
  const onAction = vi.fn()
  const view = render(
    <InventoryPage
      onSelectPart={onSelectPart}
      initialFilter="all"
      onAction={onAction}
      {...props}
    />
  )
  return { onSelectPart, onAction, ...view }
}

describe('InventoryPage', () => {
  it('renders loading skeleton initially', async () => {
    mockFetchInventory.mockReturnValue(new Promise(() => {}))
    const { container } = await renderInventoryPage()
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders inventory table with items', async () => {
    mockInventoryResult()
    await renderInventoryPage()
    await waitFor(() => {
      expect(screen.getByText('Brake Pad')).toBeInTheDocument()
    })
    expect(screen.getByText('BRK-01')).toBeInTheDocument()
    expect(screen.getByText('Rem')).toBeInTheDocument()
  })

  it('renders status filter cards with counts', async () => {
    mockInventoryResult()
    await renderInventoryPage()
    await waitFor(() => {
      expect(screen.getByText('Semua')).toBeInTheDocument()
    })
    const amanCards = screen.getAllByText('Aman')
    expect(amanCards.length).toBe(2)
  })

  it('calls onSelectPart when item name is clicked', async () => {
    mockInventoryResult()
    const { onSelectPart } = await renderInventoryPage()
    await waitFor(() => {
      expect(screen.getByText('Brake Pad')).toBeInTheDocument()
    })
    const user = userEvent.setup()
    await user.click(screen.getByText('Brake Pad'))
    expect(onSelectPart).toHaveBeenCalledWith('sp-1')
  })

  it('calls onAction when Tambah Item is clicked', async () => {
    mockInventoryResult()
    const { onAction } = await renderInventoryPage()
    await waitFor(() => {
      expect(screen.getByText('Tambah Item')).toBeInTheDocument()
    })
    const user = userEvent.setup()
    await user.click(screen.getByText('Tambah Item'))
    expect(onAction).toHaveBeenCalledWith('add_item')
  })

  it('shows search input', async () => {
    mockInventoryResult()
    await renderInventoryPage()
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Cari sparepart atau kode...')).toBeInTheDocument()
    })
  })

  it('opens filter panel on filter button click', async () => {
    mockInventoryResult()
    await renderInventoryPage()
    const user = userEvent.setup()
    await waitFor(() => {
      expect(screen.getByText('Tambah Item')).toBeInTheDocument()
    })
    const filterBtn = screen.getByText((_content, element) => element!.tagName === 'BUTTON' && element!.textContent!.includes('Filter'))
    await user.click(filterBtn)
    await waitFor(() => {
      const statusLabels = screen.getAllByText('Status')
      expect(statusLabels.length).toBeGreaterThan(0)
    })
  })

  it('shows empty state when no items', async () => {
    mockInventoryResult([])
    await renderInventoryPage()
    await waitFor(() => {
      expect(screen.getByText('Tidak ada sparepart')).toBeInTheDocument()
    })
  })

  it('shows success toast on CSV export', async () => {
    mockInventoryResult()
    mockExportCsv.mockResolvedValue(new Blob())

    const { container } = await renderInventoryPage()
    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeInTheDocument()
    })

    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:url')
    const mockRevokeObjectURL = vi.fn()
    URL.createObjectURL = mockCreateObjectURL
    URL.revokeObjectURL = mockRevokeObjectURL

    const mockAnchor = { href: '', download: '', click: vi.fn() }
    const originalCreateElement = document.createElement.bind(document)
    const createElementSpy = vi.spyOn(document, 'createElement')
    createElementSpy.mockImplementation((tagName: string) => {
      if (tagName === 'a') return mockAnchor as any
      return originalCreateElement(tagName)
    })

    const user = userEvent.setup()
    await user.click(screen.getByText('Export CSV'))
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('CSV berhasil diexport')
    })

    createElementSpy.mockRestore()
  })

  it('handles export CSV failure', async () => {
    mockInventoryResult()
    mockExportCsv.mockRejectedValue(new Error('fail'))
    await renderInventoryPage()
    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeInTheDocument()
    })
    const user = userEvent.setup()
    await user.click(screen.getByText('Export CSV'))
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Gagal export CSV')
    })
  })
})
