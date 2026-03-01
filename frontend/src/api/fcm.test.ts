import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { registerFcmToken } from './fcm'

describe('FCM API', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn()
    localStorage.setItem('listyyy_token', 'test-token')
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('registerFcmToken resolves when server returns 204 No Content', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 204,
    })
    await expect(registerFcmToken('fcm-token-123')).resolves.toBeUndefined()
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/fcm/register'),
      expect.objectContaining({ method: 'POST' })
    )
  })
})
