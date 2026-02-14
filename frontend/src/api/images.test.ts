import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { searchImages } from './images'

describe('searchImages', () => {
  const originalFetch = globalThis.fetch
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    localStorage.clear()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns results on 200', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          results: [
            { url: 'https://example.com/1.jpg', thumbUrl: 'https://example.com/1-thumb.jpg' },
          ],
        }),
    })
    const result = await searchImages('milk', 12)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      url: 'https://example.com/1.jpg',
      thumbUrl: 'https://example.com/1-thumb.jpg',
    })
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/images/search?q=milk&per_page=12'),
      expect.any(Object)
    )
  })

  it('sends Authorization when token in localStorage', async () => {
    localStorage.setItem('listyyy_token', 'token123')
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ results: [] }),
    })
    await searchImages('bread')
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token123' }),
      })
    )
  })

  it('throws on 401 with message', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })),
    })
    await expect(searchImages('test')).rejects.toThrow('יש להתחבר מחדש כדי לחפש תמונות')
  })

  it('returns empty array when results missing in response', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    })
    const result = await searchImages('x')
    expect(result).toEqual([])
  })
})
