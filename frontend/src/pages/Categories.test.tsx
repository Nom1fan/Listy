import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Categories } from './Categories'

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

describe('Categories', () => {
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
      locale: 'he',
    })
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('loads and displays categories', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve([
            { id: 'c1', nameHe: 'מכולת', iconId: 'groceries', imageUrl: null, sortOrder: 0 },
          ]),
      })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) })
    render(
      <Wrapper>
        <Categories />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText('מכולת')).toBeInTheDocument()
    })
    expect(screen.getByText('ניהול קטגוריות')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /חזרה לרשימות/i })).toHaveAttribute('href', '/lists')
  })

  it('has form to add category', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) })
    render(
      <Wrapper>
        <Categories />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByPlaceholderText('למשל: משקאות')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /הוסף קטגוריה/i })).toBeInTheDocument()
  })
})
