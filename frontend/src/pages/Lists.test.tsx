import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useWorkspaceStore } from '../store/workspaceStore'
import { Lists } from './Lists'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </MemoryRouter>
  )
}

const workspaceData = [
  { id: 'ws1', name: 'הרשימות שלי', iconId: null, memberCount: 1, role: 'owner' },
]

describe('Lists', () => {
  const originalFetch = globalThis.fetch
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    queryClient.clear()
    useAuthStore.getState().setAuth({
      token: 'test-token',
      userId: 'u1',
      email: 'test@test.com',
      phone: null,
      displayName: 'Test User',
      locale: 'he',
    })
    // Pre-set active workspace so we don't need to wait for auto-select
    useWorkspaceStore.getState().setActiveWorkspace('ws1')
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    useWorkspaceStore.getState().clearActiveWorkspace()
  })

  it('shows loading then lists when data returns', async () => {
    const fn = globalThis.fetch as ReturnType<typeof vi.fn>
    fn.mockImplementation((url: string) => {
      if (url.includes('/api/workspaces')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(workspaceData) })
      }
      if (url.includes('/api/lists')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ id: '1', name: 'List One', workspaceId: 'ws1', createdAt: '', updatedAt: '' }]),
        })
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
    })
    render(
      <Wrapper>
        <Lists />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText('List One')).toBeInTheDocument()
    })
    expect(screen.getByRole('link', { name: /List One/i })).toHaveAttribute('href', '/lists/1')
  })

  it('has tab for categories', async () => {
    const fn = globalThis.fetch as ReturnType<typeof vi.fn>
    fn.mockImplementation((url: string) => {
      if (url.includes('/api/workspaces')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(workspaceData) })
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
    })
    render(
      <Wrapper>
        <Lists />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText('קטגוריות')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'קטגוריות' })).toBeInTheDocument()
  })
})
