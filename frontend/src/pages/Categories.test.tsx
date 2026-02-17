import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
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
      expect(screen.getByText('מכולת')).toBeInTheDocument()
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

    it('shows trash icon buttons for products (no kebab menu)', async () => {
      mockFetchWithProducts()
      render(
        <Wrapper>
          <Categories />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('אורז')).toBeInTheDocument()
      })
      const deleteButtons = screen.getAllByRole('button', { name: /מחק פריט/i })
      expect(deleteButtons.length).toBeGreaterThanOrEqual(2)
      // Each delete button should contain an SVG (TrashIcon), not an emoji
      deleteButtons.forEach((btn) => {
        expect(btn.querySelector('svg')).toBeTruthy()
      })
      // No product kebab menus should exist
      expect(screen.queryByRole('button', { name: /תפריט פריט/i })).not.toBeInTheDocument()
    })

    it('opens edit product modal on single click', async () => {
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
      // Edit modal should have the expected fields
      expect(screen.getByDisplayValue('אורז')).toBeInTheDocument()
      expect(screen.getByDisplayValue('קילו')).toBeInTheDocument()
    })

    it('edit product modal has category dropdown', async () => {
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

  describe('inline product creation – autocomplete warnings', () => {
    const categoriesWithProducts = [
      { id: 'c1', nameHe: 'מכולת', iconId: 'groceries', imageUrl: null, sortOrder: 0, workspaceId: 'ws1', version: 1, addCount: 0 },
      { id: 'c2', nameHe: 'ירקות', iconId: 'veggies', imageUrl: null, sortOrder: 1, workspaceId: 'ws1', version: 1, addCount: 0 },
    ]

    const productsForAutocomplete = [
      { id: 'p1', nameHe: 'אורז', defaultUnit: 'קילו', categoryId: 'c1', categoryNameHe: 'מכולת', categoryIconId: 'groceries', iconId: null, imageUrl: null, note: null, addCount: 5, version: 1 },
      { id: 'p2', nameHe: 'אורז מלא', defaultUnit: 'קילו', categoryId: 'c1', categoryNameHe: 'מכולת', categoryIconId: 'groceries', iconId: null, imageUrl: null, note: null, addCount: 2, version: 1 },
      { id: 'p3', nameHe: 'עגבניות', defaultUnit: 'יחידה', categoryId: 'c2', categoryNameHe: 'ירקות', categoryIconId: 'veggies', iconId: null, imageUrl: null, note: 'אורגני', addCount: 3, version: 1 },
    ]

    function mockFetchForAutocomplete() {
      const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
      fetchMock.mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/api/categories')) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(categoriesWithProducts) })
        }
        if (typeof url === 'string' && url.includes('/api/products')) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(productsForAutocomplete) })
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
      })
    }

    async function openAddProductForm(categoryName: string) {
      mockFetchForAutocomplete()
      // Pre-seed products into React Query cache so autocomplete has data immediately
      queryClient.setQueryData(['products'], productsForAutocomplete)
      render(
        <Wrapper>
          <Categories />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText(categoryName)).toBeInTheDocument()
      })
      // Click the "add product" button for the target category
      const addButtons = screen.getAllByText('+ הוסף פריט לקטגוריה')
      // First button is for c1 (מכולת), second for c2 (ירקות)
      const index = categoryName === 'מכולת' ? 0 : 1
      fireEvent.click(addButtons[index])
      await waitFor(() => {
        expect(screen.getByPlaceholderText('שם פריט')).toBeInTheDocument()
      })
    }

    it('shows similar items dropdown when typing in add product form', async () => {
      await openAddProductForm('ירקות')
      const nameInput = screen.getByPlaceholderText('שם פריט')
      // Type "עגב" to match "עגבניות" which is in category ירקות
      fireEvent.change(nameInput, { target: { value: 'עגב' } })

      await waitFor(() => {
        expect(screen.getByText('פריטים דומים שכבר קיימים:')).toBeInTheDocument()
      })
    })

    it('shows exact-duplicate warning when name matches product in same category', async () => {
      await openAddProductForm('מכולת')
      const nameInput = screen.getByPlaceholderText('שם פריט')
      fireEvent.change(nameInput, { target: { value: 'אורז' } })

      await waitFor(() => {
        expect(screen.getByText(/פריט בשם זה כבר קיים בקטגוריה/)).toBeInTheDocument()
      })
    })

    it('does NOT show exact-duplicate warning when name matches product in different category', async () => {
      await openAddProductForm('ירקות')
      const nameInput = screen.getByPlaceholderText('שם פריט')
      // "אורז" exists in מכולת (c1), but we're adding to ירקות (c2)
      fireEvent.change(nameInput, { target: { value: 'אורז' } })

      await waitFor(() => {
        // Similar items dropdown should still show
        expect(screen.getByText('פריטים דומים שכבר קיימים:')).toBeInTheDocument()
      })
      // But the exact-duplicate warning should NOT appear
      expect(screen.queryByText(/פריט בשם זה כבר קיים בקטגוריה/)).not.toBeInTheDocument()
    })
  })
})
