import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useWorkspaceStore } from '../store/workspaceStore'
import { Categories } from './Categories'
import { CategoryEdit } from './CategoryEdit'
import { ProductEdit } from './ProductEdit'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})

function Wrapper({ children, initialEntries = ['/lists'] }: { children: React.ReactNode; initialEntries?: string[] }) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/lists" element={children} />
          <Route path="/categories/:categoryId/edit" element={<CategoryEdit />} />
          <Route path="/products/:productId/edit" element={<ProductEdit />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

const mockCategories = [
  { id: 'c1', nameHe: 'מכולת', iconId: 'groceries', imageUrl: null, sortOrder: 0, workspaceId: 'ws1', version: 1 },
  { id: 'c2', nameHe: 'ירקות', iconId: 'veggies', imageUrl: null, sortOrder: 1, workspaceId: 'ws1', version: 1 },
]

const mockProducts = [
  { id: 'p1', nameHe: 'אורז', defaultUnit: 'קילו', categoryId: 'c1', categoryIconId: 'groceries', iconId: null, imageUrl: null, note: null, version: 1 },
  { id: 'p2', nameHe: 'עגבניות', defaultUnit: 'יחידה', categoryId: 'c2', categoryIconId: 'veggies', iconId: null, imageUrl: null, note: 'אורגני', version: 1 },
]

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
      profileImageUrl: null,
      locale: 'he',
    })
    useWorkspaceStore.getState().setActiveWorkspace('ws1')
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    useWorkspaceStore.getState().clearActiveWorkspace()
  })

  function mockFetchWithProducts() {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    fetchMock.mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/api/categories')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockCategories) })
      }
      if (typeof url === 'string' && url.includes('/api/products')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockProducts) })
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
    })
  }

  it('loads and displays categories', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve([
            { id: 'c1', nameHe: 'מכולת', iconId: 'groceries', imageUrl: null, sortOrder: 0, workspaceId: 'ws1' },
          ]),
      })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) })
    render(
      <Wrapper>
        <Categories />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText(/מכולת/)).toBeInTheDocument()
    })
  })

  it('has button to add category', async () => {
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
      expect(screen.getByRole('button', { name: /הוסף קטגוריה/i })).toBeInTheDocument()
    })
  })

  it('clicking FAB shows inline input for category name', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    fetchMock.mockImplementation(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) }))
    render(
      <Wrapper>
        <Categories />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /הוסף קטגוריה/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /הוסף קטגוריה/i }))
    await waitFor(() => {
      expect(screen.getByPlaceholderText('שם קטגוריה')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /צור קטגוריה/i })).toBeInTheDocument()
      expect(screen.getByText('ביטול')).toBeInTheDocument()
    })
  })

  it('category row kebab has edit and delete; edit navigates to category edit page', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    fetchMock.mockImplementation((url: string) => {
      if (typeof url === 'string' && url.includes('/api/categories/') && !url.includes('?')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ ...mockCategories[0], addCount: 0 }),
        })
      }
      if (typeof url === 'string' && url.includes('/api/categories')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockCategories) })
      }
      if (typeof url === 'string' && url.includes('/api/products')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockProducts) })
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
    })
    render(
      <Wrapper>
        <Categories />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText(/מכולת/)).toBeInTheDocument()
    })
    const kebabs = screen.getAllByRole('button', { name: /תפריט קטגוריה/i })
    fireEvent.click(kebabs[0])
    await waitFor(() => {
      expect(screen.getByText('ערוך')).toBeInTheDocument()
      expect(screen.getByText('מחק')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('ערוך'))
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'ערוך קטגוריה' })).toBeInTheDocument()
      expect(screen.getByPlaceholderText('שם קטגוריה')).toHaveValue('מכולת')
    })
  })

  describe('product interaction', () => {
    it('shows products under their categories', async () => {
      mockFetchWithProducts()
      render(
        <Wrapper>
          <Categories />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('אורז')).toBeInTheDocument()
        expect(screen.getByText('עגבניות')).toBeInTheDocument()
      })
    })

    it('shows pencil (edit) and trash buttons for products', async () => {
      mockFetchWithProducts()
      render(
        <Wrapper>
          <Categories />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('אורז')).toBeInTheDocument()
      })
      const editButtons = screen.getAllByRole('button', { name: /ערוך פריט/i })
      const deleteButtons = screen.getAllByRole('button', { name: /מחק פריט/i })
      expect(editButtons.length).toBeGreaterThanOrEqual(2)
      expect(deleteButtons.length).toBeGreaterThanOrEqual(2)
      deleteButtons.forEach((btn) => {
        expect(btn.querySelector('svg')).toBeTruthy()
      })
    })

    it('pencil button navigates to edit product page', async () => {
      mockFetchWithProducts()
      render(
        <Wrapper>
          <Categories />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('אורז')).toBeInTheDocument()
      })
      const editButtons = screen.getAllByRole('button', { name: /ערוך פריט/i })
      fireEvent.click(editButtons[0])
      await waitFor(() => {
        expect(screen.getByText('עריכת פריט')).toBeInTheDocument()
      })
      expect(screen.getByDisplayValue('אורז')).toBeInTheDocument()
    })

    it('navigates to edit product page on single click', async () => {
      mockFetchWithProducts()
      render(
        <Wrapper>
          <Categories />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('אורז')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('אורז'))
      await waitFor(() => {
        expect(screen.getByText('עריכת פריט')).toBeInTheDocument()
      })
      // Same edit item page as from lists: name and unit (product has קילו)
      expect(screen.getByDisplayValue('אורז')).toBeInTheDocument()
      expect(screen.getByDisplayValue('קילו')).toBeInTheDocument()
    })

    it('edit product page has category dropdown', async () => {
      mockFetchWithProducts()
      render(
        <Wrapper>
          <Categories />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('אורז')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('אורז'))
      await waitFor(() => {
        expect(screen.getByText('עריכת פריט')).toBeInTheDocument()
      })
      // Category label and select with both categories as options
      const categorySelect = screen.getByDisplayValue('מכולת') as HTMLSelectElement
      expect(categorySelect).toBeInTheDocument()
      expect(categorySelect.tagName).toBe('SELECT')
    })
  })

  describe('inline add product (type name, then edit via pencil)', () => {
    const categoriesWithProducts = [
      { id: 'c1', nameHe: 'מכולת', iconId: 'groceries', imageUrl: null, sortOrder: 0, workspaceId: 'ws1', version: 1 },
      { id: 'c2', nameHe: 'ירקות', iconId: 'veggies', imageUrl: null, sortOrder: 1, workspaceId: 'ws1', version: 1 },
    ]

    const productsForAdd = [
      { id: 'p1', nameHe: 'אורז', defaultUnit: 'קילו', categoryId: 'c1', categoryIconId: 'groceries', iconId: null, imageUrl: null, note: null, version: 1 },
      { id: 'p2', nameHe: 'עגבניות', defaultUnit: 'יחידה', categoryId: 'c2', categoryIconId: 'veggies', iconId: null, imageUrl: null, note: null, version: 1 },
    ]

    function mockFetchForAdd() {
      const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
      fetchMock.mockImplementation((url: string, init?: RequestInit) => {
        if (typeof url === 'string' && url.includes('/api/categories')) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(categoriesWithProducts) })
        }
        if (typeof url === 'string' && url.includes('/api/products')) {
          if (init?.method === 'POST') {
            const body = JSON.parse((init.body as string) || '{}')
            return Promise.resolve({
              ok: true,
              status: 200,
              json: () =>
                Promise.resolve({
                  id: 'p-new',
                  nameHe: body.nameHe || 'חדש',
                  defaultUnit: body.defaultUnit || 'יחידה',
                  categoryId: body.categoryId,
                  categoryIconId: null,
                  iconId: null,
                  imageUrl: null,
                  note: null,
                  version: 1,
                }),
            })
          }
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(productsForAdd) })
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
      })
    }

    it('clicking add shows name input and add button', async () => {
      mockFetchForAdd()
      render(
        <Wrapper>
          <Categories />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText(/מכולת/)).toBeInTheDocument()
      })
      const addButtons = screen.getAllByText('+ הוסף פריט לקטגוריה')
      fireEvent.click(addButtons[0])
      await waitFor(() => {
        expect(screen.getByPlaceholderText('שם הפריט')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'הוסף' })).toBeInTheDocument()
        expect(screen.getByText('ביטול')).toBeInTheDocument()
      })
    })

    it('typing name and clicking add creates product', async () => {
      mockFetchForAdd()
      render(
        <Wrapper>
          <Categories />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText(/מכולת/)).toBeInTheDocument()
      })
      fireEvent.click(screen.getAllByText('+ הוסף פריט לקטגוריה')[0])
      await waitFor(() => {
        expect(screen.getByPlaceholderText('שם הפריט')).toBeInTheDocument()
      })
      const nameInput = screen.getByPlaceholderText('שם הפריט')
      fireEvent.change(nameInput, { target: { value: 'חלב' } })
      fireEvent.click(screen.getByRole('button', { name: 'הוסף' }))
      await waitFor(() => {
        const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
        const postCalls = fetchMock.mock.calls.filter((args) => {
          const url = args[0] as string
          const init = args[1] as RequestInit | undefined
          return typeof url === 'string' && url.endsWith('/api/products') && init?.method === 'POST'
        })
        expect(postCalls.length).toBeGreaterThanOrEqual(1)
        const init = postCalls[postCalls.length - 1][1] as RequestInit
        const body = JSON.parse((init?.body as string) || '{}')
        expect(body.nameHe).toBe('חלב')
        expect(body.defaultUnit).toBe('יחידה')
        expect(body.categoryId).toBe('c1')
      })
    })
  })

  describe('ProductEdit "ללא קטגוריה" resolves to "אחר" category', () => {
    it('creates "אחר" category and moves product when selecting no category and "אחר" does not exist', async () => {
      const categoriesWithoutOther = [
        { id: 'c1', nameHe: 'מכולת', iconId: 'groceries', imageUrl: null, sortOrder: 0, workspaceId: 'ws1', version: 1 },
        { id: 'c2', nameHe: 'ירקות', iconId: 'veggies', imageUrl: null, sortOrder: 1, workspaceId: 'ws1', version: 1 },
      ]
      const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
      fetchMock.mockImplementation((url: string, init?: RequestInit) => {
        if (typeof url === 'string' && url.includes('/api/products')) {
          if (init?.method === 'PATCH') {
            const body = JSON.parse((init?.body as string) || '{}')
            return Promise.resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({ ...mockProducts[0], categoryId: body.categoryId || 'c-other', version: 1 }),
            })
          }
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockProducts) })
        }
        if (typeof url === 'string' && url.includes('/api/categories')) {
          if (init?.method === 'POST') {
            const body = JSON.parse((init?.body as string) || '{}')
            return Promise.resolve({
              ok: true,
              status: 200,
              json: () =>
                Promise.resolve({
                  id: 'c-other',
                  nameHe: body.nameHe || 'אחר',
                  iconId: null,
                  imageUrl: null,
                  sortOrder: 0,
                  workspaceId: body.workspaceId,
                  version: 1,
                }),
            })
          }
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(categoriesWithoutOther) })
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
      })
      render(
        <Wrapper initialEntries={[{ pathname: '/products/p1/edit', state: { from: 'categories' } }]}>
          <ProductEdit />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByDisplayValue('אורז')).toBeInTheDocument()
      })
      const catSelect = screen.getByDisplayValue('מכולת') as HTMLSelectElement
      fireEvent.change(catSelect, { target: { value: '' } })
      fireEvent.click(screen.getByRole('button', { name: 'שמור' }))
      await waitFor(() => {
        const postCalls = fetchMock.mock.calls.filter((args) => {
          const url = args[0] as string
          const init = args[1] as RequestInit | undefined
          return typeof url === 'string' && url.includes('/api/categories') && init?.method === 'POST'
        })
        expect(postCalls.length).toBeGreaterThanOrEqual(1)
        const createBody = JSON.parse((postCalls[postCalls.length - 1][1] as RequestInit)?.body as string)
        expect(createBody.nameHe).toBe('אחר')
        expect(createBody.workspaceId).toBe('ws1')
      })
      await waitFor(() => {
        const patchCalls = fetchMock.mock.calls.filter((args) => {
          const url = args[0] as string
          const init = args[1] as RequestInit | undefined
          return typeof url === 'string' && url.includes('/api/products/p1') && init?.method === 'PATCH'
        })
        expect(patchCalls.length).toBeGreaterThanOrEqual(1)
        const updateBody = JSON.parse((patchCalls[patchCalls.length - 1][1] as RequestInit)?.body as string)
        expect(updateBody.categoryId).toBe('c-other')
      })
    })
  })
})
