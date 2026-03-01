import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useWorkspaceStore } from '../store/workspaceStore'
import { ListCreate } from './ListCreate'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})

function Wrapper({ children, initialEntries = ['/lists/new'] }: { children: React.ReactNode; initialEntries?: string[] }) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/lists" element={<div>Lists page</div>} />
          <Route path="/lists/new" element={children} />
          <Route path="/lists/:listId" element={<div>List detail</div>} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('ListCreate', () => {
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
    useWorkspaceStore.getState().setActiveWorkspace('ws1')
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    useWorkspaceStore.getState().clearActiveWorkspace()
  })

  it('shows create form with mandatory name field and create/cancel buttons', async () => {
    const fn = globalThis.fetch as ReturnType<typeof vi.fn>
    fn.mockImplementation((url: string) => {
      if (url.includes('/api/categories')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
    })
    render(
      <Wrapper>
        <ListCreate />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText('רשימה חדשה')).toBeInTheDocument()
    })
    expect(screen.getByPlaceholderText('שם הרשימה')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /צור רשימה/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ביטול' })).toBeInTheDocument()
    expect(screen.getByText(/שם הרשימה/)).toHaveTextContent(/\*/)
  })

  it('redirects to /lists when no active workspace', async () => {
    useWorkspaceStore.getState().clearActiveWorkspace()
    const fn = globalThis.fetch as ReturnType<typeof vi.fn>
    fn.mockImplementation(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) }))
    render(
      <Wrapper>
        <ListCreate />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText('Lists page')).toBeInTheDocument()
    })
    expect(screen.queryByText('רשימה חדשה')).not.toBeInTheDocument()
  })

  it('submit with name creates list and navigates to list detail', async () => {
    const newList = {
      id: 'new-list-1',
      name: 'רשימה חדשה שלי',
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
    const fn = globalThis.fetch as ReturnType<typeof vi.fn>
    fn.mockImplementation((url: string, opts?: { method?: string; body?: string }) => {
      if (url.includes('/api/categories')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
      }
      if (url.includes('/api/lists') && opts?.method === 'POST') {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(newList) })
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
    })
    render(
      <Wrapper>
        <ListCreate />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByPlaceholderText('שם הרשימה')).toBeInTheDocument()
    })
    fireEvent.change(screen.getByPlaceholderText('שם הרשימה'), { target: { value: 'רשימה חדשה שלי' } })
    fireEvent.click(screen.getByRole('button', { name: /צור רשימה/i }))
    await waitFor(() => {
      expect(screen.getByText('List detail')).toBeInTheDocument()
    })
    expect(fn).toHaveBeenCalledWith(
      expect.stringContaining('/api/lists'),
      expect.objectContaining({ method: 'POST', body: expect.stringContaining('רשימה חדשה שלי') })
    )
  })
})
