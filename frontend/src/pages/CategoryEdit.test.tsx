import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { CategoryEdit } from './CategoryEdit'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})

function Wrapper({
  children,
  initialEntries = ['/categories/c1/edit'],
}: {
  children: React.ReactNode
  initialEntries?: Array<string | { pathname: string; state?: Record<string, unknown> }>
}) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
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
    const saveBtn = screen.getByRole('button', { name: /שמור/i })
    expect(saveBtn).toBeInTheDocument()
    expect(saveBtn).toBeDisabled() // no changes yet
    expect(screen.getByText('ביטול')).toBeInTheDocument()
    expect(screen.getByText('מחק')).toBeInTheDocument()
  })

  it('enables save button when user changes the category name', async () => {
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
      expect(screen.getByPlaceholderText('שם קטגוריה')).toHaveValue('מכולת')
    }, { timeout: 3000 })
    const saveBtn = screen.getByRole('button', { name: /שמור/i })
    expect(saveBtn).toBeDisabled()
    fireEvent.change(screen.getByPlaceholderText('שם קטגוריה'), { target: { value: 'מכולת מעודכנת' } })
    await waitFor(() => {
      expect(saveBtn).not.toBeDisabled()
    })
  })

  it('cancel button navigates back to categories tab when opened from categories', async () => {
    mockNavigate.mockClear()
    const fn = globalThis.fetch as ReturnType<typeof vi.fn>
    fn.mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/api/categories/') && !url.includes('?')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockCategory) })
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
    })
    render(
      <Wrapper
        initialEntries={[{ pathname: '/categories/c1/edit', state: { from: 'categories' } }]}
      >
        <CategoryEdit />
      </Wrapper>,
    )
    await waitFor(() => {
      expect(screen.getByPlaceholderText('שם קטגוריה')).toBeInTheDocument()
    }, { timeout: 3000 })
    fireEvent.click(screen.getByText('ביטול'))
    expect(mockNavigate).toHaveBeenCalledWith('/lists?tab=categories', {
      state: { tab: 'categories' },
    })
  })
})
