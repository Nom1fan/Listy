import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { ProductBankView } from './ProductBankView'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})

const mockList = {
  id: 'list1',
  name: 'קניות',
  workspaceId: 'ws1',
  iconId: null,
  imageUrl: null,
  sortOrder: 0,
  categoryIds: ['c1', 'c2'],
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
  version: 0,
}

const mockCategories = [
  { id: 'c1', nameHe: 'מכולת', iconId: 'groceries', imageUrl: null, sortOrder: 0, workspaceId: 'ws1', version: 1 },
  { id: 'c2', nameHe: 'ירקות', iconId: 'veggies', imageUrl: null, sortOrder: 1, workspaceId: 'ws1', version: 1 },
]

const mockProducts = [
  { id: 'p1', nameHe: 'אורז', defaultUnit: 'קילו', categoryId: 'c1', categoryNameHe: 'מכולת', categoryIconId: 'groceries', iconId: null, imageUrl: null, note: null, sectionNameHe: 'יבשים', addCount: 2, version: 1 },
  { id: 'p3', nameHe: 'במבה', defaultUnit: 'יחידה', categoryId: 'c1', categoryNameHe: 'מכולת', categoryIconId: 'groceries', iconId: null, imageUrl: null, note: null, sectionNameHe: 'חטיפים', addCount: 4, version: 1 },
  { id: 'p4', nameHe: 'ביסלי', defaultUnit: 'יחידה', categoryId: 'c1', categoryNameHe: 'מכולת', categoryIconId: 'groceries', iconId: null, imageUrl: null, note: null, sectionNameHe: 'חטיפים', addCount: 1, version: 1 },
  { id: 'p2', nameHe: 'עגבניות', defaultUnit: 'יחידה', categoryId: 'c2', categoryNameHe: 'ירקות', categoryIconId: 'veggies', iconId: null, imageUrl: null, note: null, sectionNameHe: 'ירקות טריים', addCount: 1, version: 1 },
]

describe('ProductBankView', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn((url: string) => {
      if (url.includes('/api/lists/list1')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockList) })
      }
      if (url.includes('/api/categories')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockCategories) })
      }
      if (url.includes('/api/products')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockProducts) })
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
    }) as typeof fetch
    queryClient.clear()
    localStorage.clear()
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

  it('starts grouped categories collapsed and expands a category on click', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ProductBankView listId="list1" />
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /פתח קטגוריה מכולת/ })).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /פתח קטגוריה מכולת/ })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('אורז')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /פתח קטגוריה מכולת/ }))

    expect(screen.getByRole('button', { name: /סגור קטגוריה מכולת/ })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('אורז')).toBeInTheDocument()
  })

  it('groups products by saved section inside expanded categories', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ProductBankView listId="list1" />
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /פתח קטגוריה מכולת/ })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /פתח קטגוריה מכולת/ }))

    expect(screen.getByText('חטיפים')).toBeInTheDocument()
    expect(screen.getByText('יבשים')).toBeInTheDocument()
    expect(screen.getByText('במבה')).toBeInTheDocument()
    expect(screen.getByText('ביסלי')).toBeInTheDocument()
    expect(screen.getByText('אורז')).toBeInTheDocument()
  })

  it('edit modal can switch to an existing group from a dropdown', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    render(
      <QueryClientProvider client={queryClient}>
        <ProductBankView listId="list1" />
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /פתח קטגוריה מכולת/ })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /פתח קטגוריה מכולת/ }))
    fireEvent.contextMenu(screen.getByText('אורז'))

    fireEvent.click(screen.getByRole('combobox', { name: 'קבוצה' }))
    fireEvent.click(screen.getByRole('option', { name: 'חטיפים' }))
    fireEvent.click(screen.getByRole('button', { name: 'שמור' }))

    await waitFor(() => {
      const patchCalls = fetchMock.mock.calls.filter((args) => {
        const url = args[0] as string
        const init = args[1] as RequestInit | undefined
        return typeof url === 'string' && url.includes('/api/products/p1') && init?.method === 'PATCH'
      })
      expect(patchCalls.length).toBeGreaterThanOrEqual(1)
      const body = JSON.parse((patchCalls[patchCalls.length - 1][1] as RequestInit).body as string)
      expect(body.sectionNameHe).toBe('חטיפים')
    })
  })
})
