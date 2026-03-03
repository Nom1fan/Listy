import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { api, ApiError, getWsUrl, getWsUrlWithToken } from './client'

describe('api', () => {
  const originalFetch = globalThis.fetch
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    localStorage.clear()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns JSON on 200', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: '1', name: 'test' }),
    })
    const result = await api<{ id: string; name: string }>('/api/lists')
    expect(result).toEqual({ id: '1', name: 'test' })
  })

  it('returns undefined on 204', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 204,
    })
    const result = await api<void>('/api/auth/phone/request', { method: 'POST', body: '{}' })
    expect(result).toBeUndefined()
  })

  it('rejects when response is 200 with empty body (e.g. accept invitation returning ok with no body)', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.reject(new SyntaxError('Unexpected end of JSON input')),
    })
    await expect(api('/api/workspaces/ws1/invitations/accept', { method: 'POST' })).rejects.toThrow(
      'Unexpected end of JSON input'
    )
  })

  it('throws on !res.ok with message from JSON', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve(JSON.stringify({ message: 'Invalid input' })),
    })
    await expect(api('/api/x')).rejects.toThrow('Invalid input')
  })

  it('throws ApiError with status code on failure', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 409,
      text: () => Promise.resolve(JSON.stringify({ message: 'Conflict' })),
    })
    try {
      await api('/api/x')
      expect.fail('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError)
      expect((e as ApiError).status).toBe(409)
      expect((e as ApiError).isConflict()).toBe(true)
      expect((e as ApiError).message).toBe('Conflict')
    }
  })

  it('ApiError.isConflict returns false for non-409 errors', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve(JSON.stringify({ message: 'Bad request' })),
    })
    try {
      await api('/api/x')
      expect.fail('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError)
      expect((e as ApiError).isConflict()).toBe(false)
    }
  })

  it('adds Authorization when token in localStorage', async () => {
    localStorage.setItem('listyyy_token', 'abc')
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    })
    await api('/api/lists')
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer abc' }),
      })
    )
  })

  it('on 401 with token: refresh succeeds then retries request', async () => {
    localStorage.setItem('listyyy_token', 'old-token')
    const tokenRefreshedHandler = vi.fn()
    window.addEventListener('listyyy:token-refreshed', tokenRefreshedHandler)
    const fn = globalThis.fetch as ReturnType<typeof vi.fn>
    fn
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ token: 'new-token', userId: 'u1', email: null, phone: null, displayName: null, profileImageUrl: null, locale: 'he' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'lists' }),
      })
    const result = await api<{ data: string }>('/api/lists')
    expect(result).toEqual({ data: 'lists' })
    expect(localStorage.getItem('listyyy_token')).toBe('new-token')
    expect(tokenRefreshedHandler).toHaveBeenCalledTimes(1)
    expect((tokenRefreshedHandler.mock.calls[0][0] as CustomEvent).detail).toEqual({
      token: 'new-token',
      userId: 'u1',
      email: null,
      phone: null,
      displayName: null,
      profileImageUrl: null,
      locale: 'he',
    })
    window.removeEventListener('listyyy:token-refreshed', tokenRefreshedHandler)
  })

  it('on 401 with token: refresh returns 401 → dispatches auth-failure and throws', async () => {
    localStorage.setItem('listyyy_token', 'old-token')
    const authFailureHandler = vi.fn()
    window.addEventListener('listyyy:auth-failure', authFailureHandler)
    const fn = globalThis.fetch as ReturnType<typeof vi.fn>
    fn
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({ ok: false, status: 401 })
    await expect(api('/api/lists')).rejects.toThrow('פג תוקף החיבור')
    expect(authFailureHandler).toHaveBeenCalled()
    expect(localStorage.getItem('listyyy_token')).toBeNull()
    window.removeEventListener('listyyy:auth-failure', authFailureHandler)
  })

  it('on 401 with token: refresh network error → throws connection error, does NOT log out', async () => {
    localStorage.setItem('listyyy_token', 'old-token')
    const authFailureHandler = vi.fn()
    window.addEventListener('listyyy:auth-failure', authFailureHandler)
    const fn = globalThis.fetch as ReturnType<typeof vi.fn>
    fn
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockRejectedValueOnce(new Error('Network error'))
    await expect(api('/api/lists')).rejects.toThrow('אין חיבור לשרת')
    expect(authFailureHandler).not.toHaveBeenCalled()
    expect(localStorage.getItem('listyyy_token')).toBe('old-token')
    window.removeEventListener('listyyy:auth-failure', authFailureHandler)
  })
})

describe('getWsUrl', () => {
  it('returns http URL with current host and /ws when VITE_WS_BASE unset', () => {
    const url = getWsUrl()
    expect(url).toMatch(/^https?:\/\//)
    expect(url).toContain('/ws')
    expect(url).not.toMatch(/^ws:/)
  })
})

describe('getWsUrlWithToken', () => {
  it('appends access_token query param', () => {
    const url = getWsUrlWithToken('my-jwt-token')
    expect(url).toContain('/ws')
    expect(url).toContain('access_token=my-jwt-token')
  })
  it('encodes token in URL', () => {
    const url = getWsUrlWithToken('token/with=special')
    expect(url).toContain('access_token=token%2Fwith%3Dspecial')
  })
})
