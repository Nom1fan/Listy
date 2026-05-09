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

type InitialEntry = string | { pathname: string; state?: Record<string, unknown> }
function Wrapper({ children, initialEntries = ['/lists'] }: { children: React.ReactNode; initialEntries?: InitialEntry[] }) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/lists" element={children} />
          <Route path="/categories" element={<Categories />} />
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
  { id: 'p1', nameHe: 'אורז', defaultUnit: 'קילו', categoryId: 'c1', categoryIconId: 'groceries', iconId: null, imageUrl: null, note: null, sectionNameHe: 'יבשים', version: 1 },
  { id: 'p2', nameHe: 'עגבניות', defaultUnit: 'יחידה', categoryId: 'c2', categoryIconId: 'veggies', iconId: null, imageUrl: null, note: 'אורגני', sectionNameHe: 'ירקות טריים', version: 1 },
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

  function expandCategory(name: string) {
    fireEvent.click(screen.getAllByRole('button', { name: new RegExp(`פתח קטגוריה ${name}`) })[0])
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

  it('clicking category expand/collapse highlights the category row', async () => {
    mockFetchWithProducts()
    render(
      <Wrapper>
        <Categories />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText(/מכולת/)).toBeInTheDocument()
    })
    const categoryRow = screen.getByText('מכולת').closest('li')!
    const toggleBtns = screen.getAllByRole('button', { name: /פתח קטגוריה מכולת|סגור קטגוריה מכולת/ })
    fireEvent.click(toggleBtns[0])
    await waitFor(() => {
      expect(categoryRow).toHaveStyle({ background: '#e8f5e9' })
    })
  })

  it('starts with categories collapsed by default', async () => {
    mockFetchWithProducts()
    render(
      <Wrapper>
        <Categories />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText(/מכולת/)).toBeInTheDocument()
    })
    expect(screen.getAllByRole('button', { name: /פתח קטגוריה מכולת/ })[0]).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('אורז')).not.toBeInTheDocument()
  })

  it('searches products and expands categories with matching products', async () => {
    mockFetchWithProducts()
    render(
      <Wrapper>
        <Categories />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText(/מכולת/)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText('חיפוש קטגוריות ופריטים'), { target: { value: 'אורז' } })

    expect(screen.getByText('מכולת')).toBeInTheDocument()
    expect(screen.getByText('אורז')).toBeInTheDocument()
    expect(screen.queryByText('ירקות')).not.toBeInTheDocument()
    expect(screen.queryByText('עגבניות')).not.toBeInTheDocument()
  })

  it('searches product section names and shows matching products', async () => {
    mockFetchWithProducts()
    render(
      <Wrapper>
        <Categories />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText(/מכולת/)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText('חיפוש קטגוריות ופריטים'), { target: { value: 'יבשים' } })

    expect(screen.getByText('מכולת')).toBeInTheDocument()
    expect(screen.getByText('יבשים')).toBeInTheDocument()
    expect(screen.getByText('אורז')).toBeInTheDocument()
    expect(screen.queryByText('ירקות')).not.toBeInTheDocument()
  })

  it('searches categories and clears back to default collapsed state', async () => {
    mockFetchWithProducts()
    render(
      <Wrapper>
        <Categories />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText(/מכולת/)).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('חיפוש קטגוריות ופריטים')
    fireEvent.change(searchInput, { target: { value: 'ירקות' } })

    expect(screen.queryByText('מכולת')).not.toBeInTheDocument()
    expect(screen.getByText('ירקות')).toBeInTheDocument()
    expect(screen.getByText('עגבניות')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /נקה חיפוש/i }))

    expect((searchInput as HTMLInputElement).value).toBe('')
    expect(screen.getByText('מכולת')).toBeInTheDocument()
    expect(screen.getByText('ירקות')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /פתח קטגוריה מכולת/ })[0]).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('אורז')).not.toBeInTheDocument()
  })

  it('when navigating with highlightCategoryId and highlightProductId in location state, expands category and highlights only that product', async () => {
    mockFetchWithProducts()
    render(
      <Wrapper initialEntries={[{ pathname: '/lists', state: { highlightCategoryId: 'c1', highlightProductId: 'p1' } }]}>
        <Categories />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText(/מכולת/)).toBeInTheDocument()
    })
    await waitFor(() => {
      const row = screen.getByText('מכולת').closest('li')
      expect(row).toHaveStyle({ background: '#fff' })
    })
    const productRow = screen.getByText('אורז').closest('li')
    expect(productRow).toHaveStyle({ background: '#e8f5e9' })
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
        expect(screen.getByText(/מכולת/)).toBeInTheDocument()
      })
      expandCategory('מכולת')
      expandCategory('ירקות')
      expect(screen.getByText('אורז')).toBeInTheDocument()
      expect(screen.getByText('עגבניות')).toBeInTheDocument()
    })

    it('shows saved product section names inside expanded categories', async () => {
      mockFetchWithProducts()
      render(
        <Wrapper>
          <Categories />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText(/מכולת/)).toBeInTheDocument()
      })
      expandCategory('מכולת')

      expect(screen.getByText('יבשים')).toBeInTheDocument()
      expect(screen.getByText('אורז')).toBeInTheDocument()
    })

    it('shows pencil (edit) and trash buttons for products', async () => {
      mockFetchWithProducts()
      render(
        <Wrapper>
          <Categories />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText(/מכולת/)).toBeInTheDocument()
      })
      expandCategory('מכולת')
      expandCategory('ירקות')
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
        expect(screen.getByText(/מכולת/)).toBeInTheDocument()
      })
      expandCategory('מכולת')
      const editButtons = screen.getAllByRole('button', { name: /ערוך פריט/i })
      fireEvent.click(editButtons[0])
      await waitFor(() => {
        expect(screen.getByText('עריכת פריט')).toBeInTheDocument()
      })
      expect(screen.getByDisplayValue('אורז')).toBeInTheDocument()
    })

    it('saving from product edit returns to category management', async () => {
      const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
      fetchMock.mockImplementation((url: string, init?: RequestInit) => {
        if (typeof url === 'string' && url.includes('/api/products/p1') && init?.method === 'PATCH') {
          const body = JSON.parse((init.body as string) || '{}')
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ ...mockProducts[0], ...body, id: 'p1', version: 2 }),
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
        <MemoryRouter initialEntries={[{ pathname: '/products/p1/edit', state: { from: 'categories' } }]}>
          <QueryClientProvider client={queryClient}>
            <Routes>
              <Route path="/products/:productId/edit" element={<ProductEdit />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/lists" element={<div>Lists screen</div>} />
            </Routes>
          </QueryClientProvider>
        </MemoryRouter>
      )
      await waitFor(() => {
        expect(screen.getByDisplayValue('אורז')).toBeInTheDocument()
      })
      fireEvent.change(screen.getByDisplayValue('אורז'), { target: { value: 'אורז מלא' } })
      fireEvent.click(screen.getByRole('button', { name: 'שמור' }))
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'קטגוריות' })).toBeInTheDocument()
      })
      expect(screen.queryByText('Lists screen')).not.toBeInTheDocument()
    })

    it('saving from product edit sends changed section name', async () => {
      const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
      fetchMock.mockImplementation((url: string, init?: RequestInit) => {
        if (typeof url === 'string' && url.includes('/api/products/p1') && init?.method === 'PATCH') {
          const body = JSON.parse((init.body as string) || '{}')
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ ...mockProducts[0], ...body, id: 'p1', version: 2 }),
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
        <MemoryRouter initialEntries={[{ pathname: '/products/p1/edit', state: { from: 'categories' } }]}>
          <QueryClientProvider client={queryClient}>
            <Routes>
              <Route path="/products/:productId/edit" element={<ProductEdit />} />
              <Route path="/categories" element={<Categories />} />
            </Routes>
          </QueryClientProvider>
        </MemoryRouter>
      )
      await waitFor(() => {
        expect(screen.getByDisplayValue('אורז')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByRole('combobox', { name: 'קבוצה' }))
      fireEvent.click(screen.getByRole('option', { name: '+ הוסף קבוצה חדשה' }))
      fireEvent.change(screen.getByLabelText('שם קבוצה חדשה'), { target: { value: 'חטיפים' } })
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

    it('saving from product edit can switch to an existing group from a dropdown', async () => {
      const productsWithGroups = [
        ...mockProducts,
        { id: 'p3', nameHe: 'במבה', defaultUnit: 'יחידה', categoryId: 'c1', categoryIconId: 'groceries', iconId: null, imageUrl: null, note: null, sectionNameHe: 'חטיפים', version: 1 },
      ]
      const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
      fetchMock.mockImplementation((url: string, init?: RequestInit) => {
        if (typeof url === 'string' && url.includes('/api/products/p1') && init?.method === 'PATCH') {
          const body = JSON.parse((init.body as string) || '{}')
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ ...productsWithGroups[0], ...body, id: 'p1', version: 2 }),
          })
        }
        if (typeof url === 'string' && url.includes('/api/categories')) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockCategories) })
        }
        if (typeof url === 'string' && url.includes('/api/products')) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(productsWithGroups) })
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
      })
      render(
        <MemoryRouter initialEntries={[{ pathname: '/products/p1/edit', state: { from: 'categories' } }]}>
          <QueryClientProvider client={queryClient}>
            <Routes>
              <Route path="/products/:productId/edit" element={<ProductEdit />} />
              <Route path="/categories" element={<Categories />} />
            </Routes>
          </QueryClientProvider>
        </MemoryRouter>
      )
      await waitFor(() => {
        expect(screen.getByDisplayValue('אורז')).toBeInTheDocument()
      })

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

    it('product edit group dropdown can switch to add new group input', async () => {
      const productsWithGroups = [
        ...mockProducts,
        { id: 'p3', nameHe: 'במבה', defaultUnit: 'יחידה', categoryId: 'c1', categoryIconId: 'groceries', iconId: null, imageUrl: null, note: null, sectionNameHe: 'חטיפים', version: 1 },
      ]
      const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
      fetchMock.mockImplementation((url: string, init?: RequestInit) => {
        if (typeof url === 'string' && url.includes('/api/products/p1') && init?.method === 'PATCH') {
          const body = JSON.parse((init.body as string) || '{}')
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ ...productsWithGroups[0], ...body, id: 'p1', version: 2 }),
          })
        }
        if (typeof url === 'string' && url.includes('/api/categories')) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockCategories) })
        }
        if (typeof url === 'string' && url.includes('/api/products')) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(productsWithGroups) })
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
      })
      render(
        <MemoryRouter initialEntries={[{ pathname: '/products/p1/edit', state: { from: 'categories' } }]}>
          <QueryClientProvider client={queryClient}>
            <Routes>
              <Route path="/products/:productId/edit" element={<ProductEdit />} />
              <Route path="/categories" element={<Categories />} />
            </Routes>
          </QueryClientProvider>
        </MemoryRouter>
      )
      await waitFor(() => {
        expect(screen.getByDisplayValue('אורז')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('combobox', { name: 'קבוצה' }))
      fireEvent.click(screen.getByRole('option', { name: '+ הוסף קבוצה חדשה' }))
      fireEvent.change(screen.getByLabelText('שם קבוצה חדשה'), { target: { value: 'קפואים' } })
      fireEvent.click(screen.getByRole('button', { name: 'שמור' }))

      await waitFor(() => {
        const patchCalls = fetchMock.mock.calls.filter((args) => {
          const url = args[0] as string
          const init = args[1] as RequestInit | undefined
          return typeof url === 'string' && url.includes('/api/products/p1') && init?.method === 'PATCH'
        })
        expect(patchCalls.length).toBeGreaterThanOrEqual(1)
        const body = JSON.parse((patchCalls[patchCalls.length - 1][1] as RequestInit).body as string)
        expect(body.sectionNameHe).toBe('קפואים')
      })
    })

    it('preserves expanded categories when returning from editing a product', async () => {
      const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
      fetchMock.mockImplementation((url: string, init?: RequestInit) => {
        if (typeof url === 'string' && url.includes('/api/products/p1') && init?.method === 'PATCH') {
          const body = JSON.parse((init.body as string) || '{}')
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ ...mockProducts[0], ...body, id: 'p1', version: 2 }),
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
        <MemoryRouter initialEntries={['/categories']}>
          <QueryClientProvider client={queryClient}>
            <Routes>
              <Route path="/categories" element={<Categories />} />
              <Route path="/products/:productId/edit" element={<ProductEdit />} />
            </Routes>
          </QueryClientProvider>
        </MemoryRouter>
      )
      await waitFor(() => {
        expect(screen.getByText(/מכולת/)).toBeInTheDocument()
      })
      expandCategory('מכולת')
      expandCategory('ירקות')
      fireEvent.click(screen.getByText('אורז'))
      await waitFor(() => {
        expect(screen.getByText('עריכת פריט')).toBeInTheDocument()
      })
      fireEvent.change(screen.getByDisplayValue('אורז'), { target: { value: 'אורז מלא' } })
      fireEvent.click(screen.getByRole('button', { name: 'שמור' }))
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'קטגוריות' })).toBeInTheDocument()
      })
      expect(screen.getAllByRole('button', { name: /סגור קטגוריה מכולת/ })[0]).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getAllByRole('button', { name: /סגור קטגוריה ירקות/ })[0]).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByText('אורז')).toBeInTheDocument()
      expect(screen.getByText('עגבניות')).toBeInTheDocument()
    })

    it('preserves expanded categories when using the edit screen back button', async () => {
      mockFetchWithProducts()
      render(
        <MemoryRouter initialEntries={['/categories']}>
          <QueryClientProvider client={queryClient}>
            <Routes>
              <Route path="/categories" element={<Categories />} />
              <Route path="/products/:productId/edit" element={<ProductEdit />} />
            </Routes>
          </QueryClientProvider>
        </MemoryRouter>
      )
      await waitFor(() => {
        expect(screen.getByText(/מכולת/)).toBeInTheDocument()
      })
      expandCategory('מכולת')
      expandCategory('ירקות')
      fireEvent.click(screen.getByText('אורז'))
      await waitFor(() => {
        expect(screen.getByText('עריכת פריט')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByLabelText('חזרה'))
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'קטגוריות' })).toBeInTheDocument()
      })
      expect(screen.getAllByRole('button', { name: /סגור קטגוריה מכולת/ })[0]).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getAllByRole('button', { name: /סגור קטגוריה ירקות/ })[0]).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByText('אורז')).toBeInTheDocument()
      expect(screen.getByText('עגבניות')).toBeInTheDocument()
    })

    it('navigates to edit product page on single click', async () => {
      mockFetchWithProducts()
      render(
        <Wrapper>
          <Categories />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText(/מכולת/)).toBeInTheDocument()
      })
      expandCategory('מכולת')
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
        expect(screen.getByText(/מכולת/)).toBeInTheDocument()
      })
      expandCategory('מכולת')
      fireEvent.click(screen.getByText('אורז'))
      await waitFor(() => {
        expect(screen.getByText('עריכת פריט')).toBeInTheDocument()
      })
      // Category dropdown with current category selected
      const categorySelect = screen.getByRole('combobox', { name: 'קטגוריה' })
      expect(categorySelect).toBeInTheDocument()
      expect(categorySelect).toHaveTextContent('מכולת')
    })
  })

  describe('inline add product (type name, then edit via pencil)', () => {
    const categoriesWithProducts = [
      { id: 'c1', nameHe: 'מכולת', iconId: 'groceries', imageUrl: null, sortOrder: 0, workspaceId: 'ws1', version: 1 },
      { id: 'c2', nameHe: 'ירקות', iconId: 'veggies', imageUrl: null, sortOrder: 1, workspaceId: 'ws1', version: 1 },
    ]

    const productsForAdd = [
      { id: 'p1', nameHe: 'אורז', defaultUnit: 'קילו', categoryId: 'c1', categoryIconId: 'groceries', iconId: null, imageUrl: null, note: null, sectionNameHe: 'יבשים', version: 1 },
      { id: 'p2', nameHe: 'עגבניות', defaultUnit: 'יחידה', categoryId: 'c2', categoryIconId: 'veggies', iconId: null, imageUrl: null, note: null, sectionNameHe: 'ירקות טריים', version: 1 },
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
                  sectionNameHe: body.sectionNameHe ?? null,
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
      expandCategory('מכולת')
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
      expandCategory('מכולת')
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
      const catSelect = screen.getByRole('combobox', { name: 'קטגוריה' })
      fireEvent.click(catSelect)
      fireEvent.click(screen.getByRole('option', { name: 'ללא קטגוריה (אחר)' }))
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
