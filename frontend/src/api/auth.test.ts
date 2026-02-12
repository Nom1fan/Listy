import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { register, login, requestPhoneOtp, verifyPhoneOtp } from './auth'

describe('auth API', () => {
  const originalFetch = globalThis.fetch
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })
  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('register sends POST with body and returns AuthResponse', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          token: 'jwt',
          userId: 'u1',
          email: 'a@b.com',
          phone: null,
          displayName: 'User',
          locale: 'he',
        }),
    })
    const res = await register('a@b.com', 'pass', 'User')
    expect(res.token).toBe('jwt')
    expect(res.userId).toBe('u1')
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/register'),
      expect.objectContaining({ method: 'POST', body: expect.any(String) })
    )
  })

  it('login returns token', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ token: 't', userId: 'u', email: null, phone: null, displayName: null, locale: 'he' }),
    })
    const res = await login('a@b.com', 'pass')
    expect(res.token).toBe('t')
  })

  it('requestPhoneOtp returns void on 204', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 204,
    })
    const res = await requestPhoneOtp('+972501234567')
    expect(res).toBeUndefined()
  })

  it('verifyPhoneOtp returns AuthResponse', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          token: 'jwt',
          userId: 'u1',
          email: null,
          phone: '+972501234567',
          displayName: null,
          locale: 'he',
        }),
    })
    const res = await verifyPhoneOtp('+972501234567', '123456')
    expect(res.token).toBe('jwt')
  })
})
