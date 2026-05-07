import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { ListItemEdit } from './ListItemEdit'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/lists/list1/items/item1/edit']}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/lists/:listId/items/:itemId/edit" element={children} />
          <Route path="/lists/:listId" element={<div>list page</div>} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

const mockList = {
  id: 'list1',
  name: 'קניות',
  workspaceId: 'ws1',
  iconId: null,
  imageUrl: null,
  sortOrder: 0,
  categoryIds: ['c1'] as string[],
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  version: 3,
}

const mockItem = {
  id: 'item1',
  listId: 'list1',
  productId: null,
  customNameHe: 'פריט מותאם',
  displayName: 'פריט מותאם',
  categoryId: null,
  categoryNameHe: null,
  categoryIconId: null,
  productImageUrl: null,
  itemImageUrl: null,
  iconId: null,
  quantity: 1,
  unit: 'יחידה',
  showQuantityUnit: false,
  note: null,
  crossedOff: false,
  sortOrder: 0,
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  version: 1,
}

const mockCategories = [
  { id: 'c1', nameHe: 'מוצרי חלב', iconId: 'dairy', imageUrl: null, sortOrder: 0, workspaceId: 'ws1', version: 1 },
]

describe('ListItemEdit – create new category from item edit', () => {
  const originalFetch = globalThis.fetch
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    queryClient.clear()
    useAuthStore.getState().setAuth({
      token: 'test-token',
      userId: 'u1',
      email: 'a@b.c',
      phone: null,
      displayName: 'Test',
      profileImageUrl: null,
      locale: 'he',
    })
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('auto-attaches a freshly-created category to the list', async () => {
    const newCategoryId = 'c-new'
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    fetchMock.mockImplementation((url: string, opts?: RequestInit) => {
      if (typeof url !== 'string') return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })

      if (url.includes('/api/lists/list1/items') && (!opts || opts.method === 'GET' || !opts.method)) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([mockItem]) })
      }
      if (url.includes('/api/lists/list1/items/item1') && opts?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ ...mockItem, categoryId: newCategoryId, version: 2 }),
        })
      }
      if (url.includes('/api/lists/list1') && (opts?.method === 'PUT' || opts?.method === 'PATCH')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ ...mockList, categoryIds: ['c1', newCategoryId], version: 4 }),
        })
      }
      if (url.includes('/api/lists/list1')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockList) })
      }
      if (url.includes('/api/categories') && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            id: newCategoryId,
            nameHe: 'מאפים',
            iconId: null,
            imageUrl: null,
            sortOrder: 1,
            workspaceId: 'ws1',
            version: 1,
          }),
        })
      }
      if (url.includes('/api/categories')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockCategories) })
      }
      if (url.includes('/api/products')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
    })

    render(
      <Wrapper>
        <ListItemEdit />
      </Wrapper>,
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('פריט מותאם')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('combobox', { name: 'קטגוריה' }))
    await waitFor(() => {
      expect(screen.getByText('➕ קטגוריה חדשה...')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('➕ קטגוריה חדשה...'))

    const newNameInput = await screen.findByPlaceholderText('שם הקטגוריה')
    fireEvent.change(newNameInput, { target: { value: 'מאפים' } })

    const saveBtn = screen.getByRole('button', { name: /^שמור$/i })
    await act(async () => {
      fireEvent.click(saveBtn)
    })

    await waitFor(() => {
      const putCall = fetchMock.mock.calls.find(
        ([url, opts]) =>
          typeof url === 'string' &&
          /\/api\/lists\/list1$/.test(url.split('?')[0]) &&
          (opts as RequestInit | undefined)?.method === 'PUT'
      )
      expect(putCall).toBeTruthy()
      const body = JSON.parse(((putCall![1] as RequestInit).body as string) || '{}')
      expect(body.categoryIds).toEqual(['c1', newCategoryId])
      expect(body.version).toBe(3)
    })
  })

  it('does not re-attach a category that is already attached', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    fetchMock.mockImplementation((url: string, opts?: RequestInit) => {
      if (typeof url !== 'string') return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })

      if (url.includes('/api/lists/list1/items/item1') && opts?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ ...mockItem, categoryId: 'c1', version: 2 }),
        })
      }
      if (url.includes('/api/lists/list1/items')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([mockItem]) })
      }
      if (url.includes('/api/lists/list1')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockList) })
      }
      if (url.includes('/api/categories')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockCategories) })
      }
      if (url.includes('/api/products')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
    })

    render(
      <Wrapper>
        <ListItemEdit />
      </Wrapper>,
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('פריט מותאם')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('combobox', { name: 'קטגוריה' }))
    await waitFor(() => {
      expect(screen.getByText('מוצרי חלב')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('מוצרי חלב'))

    const saveBtn = screen.getByRole('button', { name: /^שמור$/i })
    await act(async () => {
      fireEvent.click(saveBtn)
    })

    await waitFor(() => {
      const patchedItem = fetchMock.mock.calls.find(
        ([url, opts]) =>
          typeof url === 'string' &&
          url.includes('/api/lists/list1/items/item1') &&
          (opts as RequestInit | undefined)?.method === 'PATCH'
      )
      expect(patchedItem).toBeTruthy()
    })
    const putCall = fetchMock.mock.calls.find(
      ([url, opts]) =>
        typeof url === 'string' &&
        /\/api\/lists\/list1$/.test(url.split('?')[0]) &&
        (opts as RequestInit | undefined)?.method === 'PUT'
    )
    expect(putCall).toBeUndefined()
  })
})
