import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
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
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('shows loading then lists when GET /api/lists returns data', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve([
          { id: '1', name: 'List One', ownerId: 'u1', createdAt: '', updatedAt: '' },
        ]),
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

  it('has link to categories', async () => {
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    })
    render(
      <Wrapper>
        <Lists />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText('קטגוריות')).toBeInTheDocument()
    })
    expect(screen.getByRole('link', { name: 'קטגוריות' })).toHaveAttribute('href', '/categories')
  })
})
