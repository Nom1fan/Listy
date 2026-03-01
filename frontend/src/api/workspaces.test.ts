import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { acceptWorkspaceInvitation, rejectWorkspaceInvitation } from './workspaces'

describe('workspace invitation API', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn()
    localStorage.setItem('listyyy_token', 'test-token')
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('acceptWorkspaceInvitation resolves when server returns 204 No Content', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 204,
    })
    await expect(acceptWorkspaceInvitation('ws-123')).resolves.toBeUndefined()
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/workspaces/ws-123/invitations/accept'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('rejectWorkspaceInvitation resolves when server returns 204 No Content', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 204,
    })
    await expect(rejectWorkspaceInvitation('ws-456')).resolves.toBeUndefined()
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/workspaces/ws-456/invitations/reject'),
      expect.objectContaining({ method: 'POST' })
    )
  })
})
