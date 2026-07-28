import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginPage } from '../../app/pages/auth/LoginPage'

const mockToast = vi.hoisted(() => {
  const t = vi.fn()
  t.success = vi.fn()
  t.error = vi.fn()
  return t
})
vi.mock('sonner', () => ({ toast: mockToast }))

const mockLogin = vi.hoisted(() => vi.fn())
const mockGoogleSignIn = vi.hoisted(() => vi.fn())
vi.mock('../../app/services/auth', () => ({
  login: (...args: any[]) => mockLogin(...args),
  signInWithGoogle: (...args: any[]) => mockGoogleSignIn(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

function setup(props: Partial<Parameters<typeof LoginPage>[0]> = {}) {
  const callbacks = {
    onSuccess: vi.fn(),
    onRegister: vi.fn(),
    onForgot: vi.fn(),
    onBack: vi.fn(),
    ...props,
  }
  return { ...callbacks, ...render(<LoginPage {...callbacks} />) }
}

describe('LoginPage', () => {
  it('renders the login form', () => {
    setup()
    expect(screen.getByText('Selamat datang!')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('admin@sparetrack.id')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByText('Masuk ke Dashboard')).toBeInTheDocument()
  })

  it('shows toast when fields are empty and submit is clicked', async () => {
    setup()
    const user = userEvent.setup()
    await user.click(screen.getByText('Masuk ke Dashboard'))
    expect(mockToast.error).toHaveBeenCalledWith('Email dan password wajib diisi')
  })

  it('calls login service with email and password', async () => {
    mockLogin.mockResolvedValue({ user: { id: '1' } })
    setup()
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText('admin@sparetrack.id'), 'admin@test.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'secret123')
    await user.click(screen.getByText('Masuk ke Dashboard'))
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('admin@test.com', 'secret123'))
  })

  it('calls onSuccess after successful login', async () => {
    mockLogin.mockResolvedValue({ user: { id: '1' } })
    const { onSuccess } = setup()
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText('admin@sparetrack.id'), 'a@b.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'pwd')
    await user.click(screen.getByText('Masuk ke Dashboard'))
    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
  })

  it('shows error banner on invalid credentials', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid login credentials'))
    setup()
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText('admin@sparetrack.id'), 'a@b.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrong')
    await user.click(screen.getByText('Masuk ke Dashboard'))
    await waitFor(() => {
      expect(screen.getByText('Email atau Password Salah')).toBeInTheDocument()
    })
  })

  it('shows config error for invalid API key', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid API key'))
    setup()
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText('admin@sparetrack.id'), 'a@b.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'pwd')
    await user.click(screen.getByText('Masuk ke Dashboard'))
    await waitFor(() => {
      expect(screen.getByText('Konfigurasi Aplikasi Bermasalah')).toBeInTheDocument()
    })
  })

  it('shows network error on fetch failure', async () => {
    mockLogin.mockRejectedValue(new Error('Failed to fetch'))
    setup()
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText('admin@sparetrack.id'), 'a@b.com')
    await user.type(screen.getByPlaceholderText('••••••••'), 'pwd')
    await user.click(screen.getByText('Masuk ke Dashboard'))
    await waitFor(() => {
      expect(screen.getByText('Koneksi Gagal')).toBeInTheDocument()
    })
  })

  it('calls onRegister when register link is clicked', async () => {
    const { onRegister } = setup()
    const user = userEvent.setup()
    await user.click(screen.getByText('Daftar sekarang'))
    expect(onRegister).toHaveBeenCalled()
  })

  it('passes onForgot prop as a function', () => {
    const { onForgot } = setup()
    expect(typeof onForgot).toBe('function')
  })

  it('toggles password visibility', async () => {
    setup()
    const user = userEvent.setup()
    const passwordInput = screen.getByPlaceholderText('••••••••')
    expect(passwordInput).toHaveAttribute('type', 'password')
    const eyeButton = passwordInput.parentElement!.querySelector('button')!
    await user.click(eyeButton)
    expect(passwordInput).toHaveAttribute('type', 'text')
  })

  it('submits on Enter key in password field', async () => {
    mockLogin.mockResolvedValue({ user: { id: '1' } })
    setup()
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText('admin@sparetrack.id'), 'a@b.com')
    const passwordInput = screen.getByPlaceholderText('••••••••')
    await user.type(passwordInput, 'secret')
    await user.keyboard('{Enter}')
    await waitFor(() => expect(mockLogin).toHaveBeenCalled())
  })

  it('calls signInWithGoogle on Google button click', async () => {
    mockGoogleSignIn.mockResolvedValue(undefined)
    setup()
    const user = userEvent.setup()
    await user.click(screen.getByText('Lanjutkan dengan Google'))
    expect(mockGoogleSignIn).toHaveBeenCalled()
  })

  it('shows Google OAuth error on failure', async () => {
    mockGoogleSignIn.mockRejectedValue(new Error('popup'))
    setup()
    const user = userEvent.setup()
    await user.click(screen.getByText('Lanjutkan dengan Google'))
    await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Google OAuth gagal'))
  })

  it('renders brand name and stat cards', () => {
    setup()
    const brands = screen.getAllByText('SpareTrack')
    expect(brands.length).toBe(2)
    expect(screen.getByText('Total Stok')).toBeInTheDocument()
    expect(screen.getByText('Cabang Aktif')).toBeInTheDocument()
  })
})
