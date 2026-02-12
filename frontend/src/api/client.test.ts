import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { api, getWsUrl, uploadFile } from './client'

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

  it('throws on !res.ok with message from JSON', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve(JSON.stringify({ message: 'Invalid input' })),
    })
    await expect(api('/api/x')).rejects.toThrow('Invalid input')
  })

  it('adds Authorization when token in localStorage', async () => {
    localStorage.setItem('listy_token', 'abc')
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
})

describe('getWsUrl', () => {
  it('returns http URL with current host and /ws when VITE_WS_BASE unset', () => {
    const url = getWsUrl()
    expect(url).toMatch(/^https?:\/\//)
    expect(url).toContain('/ws')
    expect(url).not.toMatch(/^ws:/)
  })
})
