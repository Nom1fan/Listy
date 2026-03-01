import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { ShareWorkspace } from './ShareWorkspace'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})

const mockWorkspace = {
  id: 'ws1',
  name: 'המרחב שלי',
  iconId: null,
  role: 'owner' as const,
  version: 1,
}

const mockMembers: Array<{ userId: string; displayName: string | null; email: string | null; phone: string | null; role: string; profileImageUrl: string | null }> = []

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/workspaces/ws1/share']}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/workspaces/:workspaceId/share" element={children} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

function mockFetchForShare() {
  const fn = globalThis.fetch as ReturnType<typeof vi.fn>
  fn.mockImplementation((url: string, init?: RequestInit) => {
    if (url.includes('/api/workspaces/ws1') && !url.includes('/members')) {
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockWorkspace) })
    }
    if (url.includes('/api/workspaces/ws1/members') && init?.method === 'GET') {
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockMembers) })
    }
    if (url.includes('/api/workspaces/ws1/members') && init?.method === 'POST') {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            userId: 'new-user',
            displayName: null,
            email: null,
            phone: null,
            role: 'editor',
            profileImageUrl: null,
          }),
      })
    }
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
  })
}

describe('ShareWorkspace', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn()
    queryClient.clear()
    useAuthStore.getState().setAuth({
      token: 'test-token',
      userId: 'u1',
      email: 'test@test.com',
      phone: null,
      displayName: 'Test',
      profileImageUrl: null,
      locale: 'he',
    })
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('renders share title and invite section for owner', async () => {
    mockFetchForShare()
    render(
      <Wrapper>
        <ShareWorkspace />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText(/שיתוף: המרחב שלי/)).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText('הזמן חבר/ה')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'הזמן' })).toBeInTheDocument()
    })
  })

  it('shows email vs phone radio and defaults to email', async () => {
    mockFetchForShare()
    render(
      <Wrapper>
        <ShareWorkspace />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText('הזמן חבר/ה')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('הזמן לפי אימייל')).toBeInTheDocument()
    expect(screen.getByLabelText('הזמן לפי טלפון')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'הזמן' })).toBeDisabled()
  })

  it('invite button stays disabled until valid email', async () => {
    const user = userEvent.setup()
    mockFetchForShare()
    render(
      <Wrapper>
        <ShareWorkspace />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'הזמן' })).toBeDisabled()
    await user.type(screen.getByPlaceholderText('email@example.com'), 'a')
    expect(screen.getByRole('button', { name: 'הזמן' })).toBeDisabled()
    await user.type(screen.getByPlaceholderText('email@example.com'), '@b.co')
    expect(screen.getByRole('button', { name: 'הזמן' })).toBeEnabled()
  })

  it('switching to phone shows country and segment inputs, invite disabled until phone complete', async () => {
    const user = userEvent.setup()
    mockFetchForShare()
    render(
      <Wrapper>
        <ShareWorkspace />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText('הזמן חבר/ה')).toBeInTheDocument()
    })
    await user.click(screen.getByLabelText('הזמן לפי טלפון'))
    expect(screen.getByLabelText('קוד מדינה')).toBeInTheDocument()
    expect(screen.getByLabelText('קטע 1')).toBeInTheDocument()
    expect(screen.getByLabelText('קטע 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'הזמן' })).toBeDisabled()

    await user.type(screen.getByLabelText('קטע 1'), '054')
    expect(screen.getByRole('button', { name: 'הזמן' })).toBeDisabled()
    await user.type(screen.getByLabelText('קטע 2'), '1234567')
    expect(screen.getByRole('button', { name: 'הזמן' })).toBeEnabled()
  })

  it('submits invite by email with valid email', async () => {
    const user = userEvent.setup()
    mockFetchForShare()
    render(
      <Wrapper>
        <ShareWorkspace />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument()
    })
    await user.type(screen.getByPlaceholderText('email@example.com'), 'friend@example.com')
    await user.click(screen.getByRole('button', { name: 'הזמן' }))

    await waitFor(() => {
      const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/workspaces/ws1/members'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'friend@example.com' }),
        })
      )
    })
  })

  it('submits invite by phone with full E.164 when phone complete', async () => {
    const user = userEvent.setup()
    mockFetchForShare()
    render(
      <Wrapper>
        <ShareWorkspace />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText('הזמן חבר/ה')).toBeInTheDocument()
    })
    await user.click(screen.getByLabelText('הזמן לפי טלפון'))
    await user.type(screen.getByLabelText('קטע 1'), '054')
    await user.type(screen.getByLabelText('קטע 2'), '1234567')
    await user.click(screen.getByRole('button', { name: 'הזמן' }))

    await waitFor(() => {
      const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
      const call = fetchMock.mock.calls.find(
        (c: unknown[]) =>
          typeof c[0] === 'string' && c[0].includes('/api/workspaces/ws1/members') && (c[1] as RequestInit | undefined)?.method === 'POST'
      ) as [string, RequestInit?] | undefined
      expect(call).toBeDefined()
      const body = JSON.parse((call![1] as RequestInit).body as string)
      expect(body).toHaveProperty('phone')
      expect(body.phone).toMatch(/^\+972\d+$/)
      expect(body).not.toHaveProperty('email')
    })
  })
})
