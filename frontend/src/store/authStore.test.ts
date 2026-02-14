import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('starts unauthenticated', () => {
    expect(useAuthStore.getState().isAuthenticated()).toBe(false)
    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('setAuth stores token and user and sets authenticated', () => {
    useAuthStore.getState().setAuth({
      token: 'jwt-123',
      userId: 'u1',
      email: 'a@b.com',
      phone: null,
      displayName: 'User',
      profileImageUrl: null,
      locale: 'he',
    })
    expect(useAuthStore.getState().isAuthenticated()).toBe(true)
    expect(useAuthStore.getState().token).toBe('jwt-123')
    expect(useAuthStore.getState().user?.email).toBe('a@b.com')
    expect(localStorage.getItem('listyyy_token')).toBe('jwt-123')
  })

  it('logout clears state and localStorage', () => {
    useAuthStore.getState().setAuth({
      token: 'x',
      userId: 'u1',
      email: null,
      phone: null,
      displayName: null,
      profileImageUrl: null,
      locale: 'he',
    })
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().isAuthenticated()).toBe(false)
    expect(useAuthStore.getState().token).toBeNull()
    expect(localStorage.getItem('listyyy_token')).toBeNull()
  })
})
