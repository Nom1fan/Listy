import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { ListEdit } from './ListEdit'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/lists/list1/edit']}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/lists/:listId/edit" element={children} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

const mockList = {
  id: 'list1',
  name: 'רשימת קניות',
  workspaceId: 'ws1',
  iconId: null,
  imageUrl: null,
  sortOrder: 0,
  categoryFilterMode: 'NONE' as const,
  categoryIds: [] as string[],
  createdAt: '',
  updatedAt: '',
  version: 0,
}

describe('ListEdit', () => {
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

  it('loads list and shows edit form with name, save, cancel, delete', async () => {
    const fn = globalThis.fetch as ReturnType<typeof vi.fn>
    fn.mockImplementation((url: string) => {
      // getList(listId) -> /api/lists/list1
      if (typeof url === 'string' && url.includes('/api/lists/') && !url.includes('/api/lists/list1/') && url.includes('list1')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockList) })
      }
      if (url.includes('/api/categories')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
    })
    render(
      <Wrapper>
        <ListEdit />
      </Wrapper>
    )
    await waitFor(() => {
      const input = screen.getByPlaceholderText('שם הרשימה')
      expect(input).toHaveValue('רשימת קניות')
    }, { timeout: 3000 })
    expect(screen.getByRole('heading', { name: 'ערוך רשימה' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /שמור/i })).toBeInTheDocument()
    expect(screen.getByText('ביטול')).toBeInTheDocument()
    expect(screen.getByText('מחק')).toBeInTheDocument()
  })
})
