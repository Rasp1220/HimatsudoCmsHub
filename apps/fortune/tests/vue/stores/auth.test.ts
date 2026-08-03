/**
 * mirrors src/stores/auth.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/api/client', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}))

import { authApi } from '@/api/client'

const mockAdmin = { id: 1, name: 'Admin', email: 'admin@example.com' }

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('initialises with no user when localStorage is empty', () => {
    const store = useAuthStore()
    expect(store.user).toBeNull()
    expect(store.accessToken).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('reads token from localStorage on initialisation', () => {
    localStorage.setItem('access_token', 'existing-token')
    const store = useAuthStore()
    expect(store.accessToken).toBe('existing-token')
    expect(store.isAuthenticated).toBe(true)
  })

  it('login stores tokens and admin in state and localStorage', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      access_token: 'access-abc',
      refresh_token: 'refresh-xyz',
      admin: mockAdmin,
    })

    const store = useAuthStore()
    await store.login({ email: 'admin@example.com', password: 'secret' })

    expect(store.accessToken).toBe('access-abc')
    expect(store.refreshToken).toBe('refresh-xyz')
    expect(store.user).toEqual(mockAdmin)
    expect(localStorage.getItem('access_token')).toBe('access-abc')
    expect(localStorage.getItem('refresh_token')).toBe('refresh-xyz')
  })

  it('logout clears state and localStorage', async () => {
    localStorage.setItem('access_token', 'token')
    localStorage.setItem('refresh_token', 'refresh')

    vi.mocked(authApi.logout).mockResolvedValue(undefined as never)

    const store = useAuthStore()
    store.user = mockAdmin

    await store.logout()

    expect(store.accessToken).toBeNull()
    expect(store.refreshToken).toBeNull()
    expect(store.user).toBeNull()
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
  })

  it('logout clears state even when API call fails', async () => {
    vi.mocked(authApi.logout).mockRejectedValue(new Error('network error'))
    localStorage.setItem('access_token', 'token')

    const store = useAuthStore()
    store.user = mockAdmin

    await store.logout().catch(() => {})

    expect(store.user).toBeNull()
    expect(store.accessToken).toBeNull()
  })

  it('rehydrate fetches user when token exists but user is null', async () => {
    localStorage.setItem('access_token', 'token')
    vi.mocked(authApi.me).mockResolvedValue(mockAdmin)

    const store = useAuthStore()
    await store.rehydrate()

    expect(store.user).toEqual(mockAdmin)
    expect(vi.mocked(authApi.me)).toHaveBeenCalledOnce()
  })

  it('rehydrate clears tokens when API returns error', async () => {
    localStorage.setItem('access_token', 'expired-token')
    vi.mocked(authApi.me).mockRejectedValue(new Error('401'))

    const store = useAuthStore()
    await store.rehydrate()

    expect(store.user).toBeNull()
    expect(store.accessToken).toBeNull()
    expect(localStorage.getItem('access_token')).toBeNull()
  })

  it('rehydrate skips API call when user is already loaded', async () => {
    localStorage.setItem('access_token', 'token')
    const store = useAuthStore()
    store.user = mockAdmin

    await store.rehydrate()

    expect(vi.mocked(authApi.me)).not.toHaveBeenCalled()
  })

  it('rehydrate skips API call when no access token', async () => {
    const store = useAuthStore()
    await store.rehydrate()

    expect(vi.mocked(authApi.me)).not.toHaveBeenCalled()
  })
})
