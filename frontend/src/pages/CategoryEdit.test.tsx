import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { CategoryEdit } from './CategoryEdit'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/categories/c1/edit']}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/categories/:categoryId/edit" element={children} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

const mockCategory = {
  id: 'c1',
  nameHe: 'מכולת',
  iconId: 'groceries',
  imageUrl: null,
  sortOrder: 0,
  workspaceId: 'ws1',
  addCount: 0,
  version: 1,
}

describe('CategoryEdit', () => {
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

  it('loads category and shows edit form with name, save, cancel, delete', async () => {
    const fn = globalThis.fetch as ReturnType<typeof vi.fn>
    fn.mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/api/categories/') && !url.includes('?')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockCategory) })
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
    })
    render(
      <Wrapper>
        <CategoryEdit />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByPlaceholderText('שם קטגוריה')).toBeInTheDocument()
    }, { timeout: 3000 })
    expect(screen.getByPlaceholderText('שם קטגוריה')).toHaveValue('מכולת')
    expect(screen.getByRole('heading', { name: 'ערוך קטגוריה' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /שמור/i })).toBeInTheDocument()
    expect(screen.getByText('ביטול')).toBeInTheDocument()
    expect(screen.getByText('מחק')).toBeInTheDocument()
  })
})
