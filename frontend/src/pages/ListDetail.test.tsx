import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { ListDetail } from './ListDetail'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/lists/list1']}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/lists/:listId" element={children} />
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
  createdAt: '2025-01-01',
  updatedAt: '2025-01-01',
}

const mockItems = [
  {
    id: 'item1',
    listId: 'list1',
    productId: 'p1',
    customNameHe: null,
    displayName: 'חלב',
    categoryId: 'c1',
    categoryNameHe: 'מוצרי חלב',
    categoryIconId: 'dairy',
    iconId: null,
    quantity: 2,
    unit: 'ליטר',
    note: null,
    crossedOff: false,
    itemImageUrl: null,
    productImageUrl: null,
    sortOrder: 0,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'item2',
    listId: 'list1',
    productId: 'p2',
    customNameHe: null,
    displayName: 'לחם',
    categoryId: 'c2',
    categoryNameHe: 'מאפים',
    categoryIconId: 'bakery',
    iconId: null,
    quantity: 1,
    unit: 'יחידה',
    note: 'מחיטה מלאה',
    crossedOff: false,
    itemImageUrl: null,
    productImageUrl: null,
    sortOrder: 1,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
]

describe('ListDetail', () => {
  const originalFetch = globalThis.fetch
  beforeEach(() => {
    globalThis.fetch = vi.fn()
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

  function mockFetch() {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/lists/list1/items')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockItems),
        })
      }
      if (url.includes('/api/lists/list1')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockList),
        })
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
    })
  }

  it('renders view mode toggle when items exist', async () => {
    mockFetch()
    render(
      <Wrapper>
        <ListDetail />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText('חלב')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /תצוגת רשימה/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /תצוגת כרטיסיות/i })).toBeInTheDocument()
  })

  it('defaults to list view and switches to grid view on toggle', async () => {
    mockFetch()
    render(
      <Wrapper>
        <ListDetail />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText('חלב')).toBeInTheDocument()
    })

    const listBtn = screen.getByRole('button', { name: /תצוגת רשימה/i })
    const gridBtn = screen.getByRole('button', { name: /תצוגת כרטיסיות/i })

    // Default: list mode is active
    expect(listBtn).toHaveAttribute('aria-pressed', 'true')
    expect(gridBtn).toHaveAttribute('aria-pressed', 'false')

    // Items and their details are visible in list view
    expect(screen.getByText('חלב')).toBeInTheDocument()
    expect(screen.getByText('לחם')).toBeInTheDocument()
    expect(screen.getByText(/מחיטה מלאה/)).toBeInTheDocument()

    // Switch to grid
    fireEvent.click(gridBtn)
    expect(gridBtn).toHaveAttribute('aria-pressed', 'true')
    expect(listBtn).toHaveAttribute('aria-pressed', 'false')

    // Items still visible in grid view
    expect(screen.getByText('חלב')).toBeInTheDocument()
    expect(screen.getByText('לחם')).toBeInTheDocument()
  })

  it('persists view mode preference in localStorage', async () => {
    localStorage.setItem('listyyy-view-mode:list-list1', 'grid')
    mockFetch()
    render(
      <Wrapper>
        <ListDetail />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText('חלב')).toBeInTheDocument()
    })

    const gridBtn = screen.getByRole('button', { name: /תצוגת כרטיסיות/i })
    expect(gridBtn).toHaveAttribute('aria-pressed', 'true')
  })

  describe('edit item dialog (single-click)', () => {
    const mockCategories = [
      { id: 'c1', nameHe: 'מוצרי חלב', iconId: 'dairy', imageUrl: null, sortOrder: 0, workspaceId: 'ws1', version: 1 },
      { id: 'c2', nameHe: 'מאפים', iconId: 'bakery', imageUrl: null, sortOrder: 1, workspaceId: 'ws1', version: 1 },
    ]

    function mockFetchWithCategories() {
      const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
      fetchMock.mockImplementation((url: string) => {
        if (url.includes('/api/lists/list1/items')) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockItems) })
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
    }

    it('opens edit modal when clicking on item name', async () => {
      mockFetchWithCategories()
      render(
        <Wrapper>
          <ListDetail />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('חלב'))
      await waitFor(() => {
        expect(screen.getByText('עריכת פריט')).toBeInTheDocument()
      })
    })

    it('edit modal shows item name field (disabled for product-based items)', async () => {
      mockFetchWithCategories()
      render(
        <Wrapper>
          <ListDetail />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('חלב'))
      await waitFor(() => {
        expect(screen.getByText('עריכת פריט')).toBeInTheDocument()
      })
      // Name field should show item name and be disabled (product-based)
      const nameInput = screen.getByDisplayValue('חלב') as HTMLInputElement
      expect(nameInput).toBeInTheDocument()
      expect(nameInput.disabled).toBe(true)
    })

    it('edit modal has unit as free text input (not a dropdown)', async () => {
      mockFetchWithCategories()
      render(
        <Wrapper>
          <ListDetail />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('חלב'))
      await waitFor(() => {
        expect(screen.getByText('עריכת פריט')).toBeInTheDocument()
      })
      // Unit should be a text input with the current unit value
      const unitInput = screen.getByDisplayValue('ליטר') as HTMLInputElement
      expect(unitInput).toBeInTheDocument()
      expect(unitInput.tagName).toBe('INPUT')
      expect(unitInput.type).toBe('text')
    })

    it('edit modal has quantity controls', async () => {
      mockFetchWithCategories()
      render(
        <Wrapper>
          <ListDetail />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('חלב'))
      await waitFor(() => {
        expect(screen.getByText('עריכת פריט')).toBeInTheDocument()
      })
      // Quantity should show current value
      const qtyInput = screen.getByDisplayValue('2') as HTMLInputElement
      expect(qtyInput).toBeInTheDocument()
    })

    it('edit modal has note field', async () => {
      mockFetchWithCategories()
      render(
        <Wrapper>
          <ListDetail />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('לחם')).toBeInTheDocument()
      })
      // Click "לחם" which has a note
      fireEvent.click(screen.getByText('לחם'))
      await waitFor(() => {
        expect(screen.getByText('עריכת פריט')).toBeInTheDocument()
      })
      const noteArea = screen.getByDisplayValue('מחיטה מלאה') as HTMLTextAreaElement
      expect(noteArea).toBeInTheDocument()
      expect(noteArea.tagName).toBe('TEXTAREA')
    })

    it('edit modal has category dropdown', async () => {
      mockFetchWithCategories()
      render(
        <Wrapper>
          <ListDetail />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('חלב'))
      await waitFor(() => {
        expect(screen.getByText('עריכת פריט')).toBeInTheDocument()
      })
      // Category select should exist with current category selected
      const catSelect = screen.getByDisplayValue('מוצרי חלב') as HTMLSelectElement
      expect(catSelect).toBeInTheDocument()
      expect(catSelect.tagName).toBe('SELECT')
    })

    it('edit modal has image/icon form section', async () => {
      mockFetchWithCategories()
      render(
        <Wrapper>
          <ListDetail />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('חלב'))
      await waitFor(() => {
        expect(screen.getByText('עריכת פריט')).toBeInTheDocument()
      })
      // DisplayImageForm should be present (it renders a "תמונה / אייקון" label)
      expect(screen.getByText('תמונה / אייקון')).toBeInTheDocument()
    })
  })

  describe('trash icon on items', () => {
    it('shows trash icon buttons instead of kebab menus', async () => {
      mockFetch()
      render(
        <Wrapper>
          <ListDetail />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })
      const deleteButtons = screen.getAllByRole('button', { name: /הסר פריט/i })
      expect(deleteButtons.length).toBe(2)
      // Each delete button should contain an SVG (TrashIcon)
      deleteButtons.forEach((btn) => {
        expect(btn.querySelector('svg')).toBeTruthy()
      })
      // No kebab menus should exist on items
      expect(screen.queryByRole('button', { name: /תפריט פריט/i })).not.toBeInTheDocument()
    })
  })

  describe('quick-add dialog – unit & amount', () => {
    async function openQuickAdd() {
      mockFetch()
      render(
        <Wrapper>
          <ListDetail />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('הוסף פריט'))
      await waitFor(() => {
        expect(screen.getByText('הוסף פריט לרשימה')).toBeInTheDocument()
      })
    }

    it('defaults unit to ללא and hides amount field', async () => {
      await openQuickAdd()

      const unitSelect = screen.getByLabelText('יחידה') as HTMLSelectElement
      expect(unitSelect.value).toBe('')
      expect(unitSelect).toHaveDisplayValue('ללא')

      expect(screen.queryByLabelText('כמות')).not.toBeInTheDocument()
    })

    it('shows amount stepper when a unit is selected', async () => {
      await openQuickAdd()

      const unitSelect = screen.getByLabelText('יחידה')
      fireEvent.change(unitSelect, { target: { value: 'יחידה' } })

      expect(screen.getByLabelText('כמות')).toBeInTheDocument()
      expect(screen.getByText('−')).toBeInTheDocument()
      expect(screen.getByText('+')).toBeInTheDocument()

      const qtyInput = screen.getByLabelText('כמות') as HTMLInputElement
      expect(qtyInput.value).toBe('1')
    })

    it('hides amount stepper when unit is switched back to ללא', async () => {
      await openQuickAdd()

      const unitSelect = screen.getByLabelText('יחידה')
      fireEvent.change(unitSelect, { target: { value: 'גרם' } })
      expect(screen.getByLabelText('כמות')).toBeInTheDocument()

      fireEvent.change(unitSelect, { target: { value: '' } })
      expect(screen.queryByLabelText('כמות')).not.toBeInTheDocument()
    })

    it('increment button increases quantity', async () => {
      await openQuickAdd()

      fireEvent.change(screen.getByLabelText('יחידה'), { target: { value: 'יחידה' } })
      const qtyInput = screen.getByLabelText('כמות') as HTMLInputElement
      expect(qtyInput.value).toBe('1')

      fireEvent.click(screen.getByText('+'))
      expect(qtyInput.value).toBe('2')

      fireEvent.click(screen.getByText('+'))
      expect(qtyInput.value).toBe('3')
    })

    it('decrement button decreases quantity but not below 1', async () => {
      await openQuickAdd()

      fireEvent.change(screen.getByLabelText('יחידה'), { target: { value: 'חבילה' } })
      const qtyInput = screen.getByLabelText('כמות') as HTMLInputElement

      fireEvent.click(screen.getByText('+'))
      fireEvent.click(screen.getByText('+'))
      expect(qtyInput.value).toBe('3')

      fireEvent.click(screen.getByText('−'))
      expect(qtyInput.value).toBe('2')

      fireEvent.click(screen.getByText('−'))
      expect(qtyInput.value).toBe('1')

      // Should not go below 1
      fireEvent.click(screen.getByText('−'))
      expect(qtyInput.value).toBe('1')
    })

    it('allows typing a quantity directly', async () => {
      await openQuickAdd()

      fireEvent.change(screen.getByLabelText('יחידה'), { target: { value: 'ק"ג' } })
      const qtyInput = screen.getByLabelText('כמות') as HTMLInputElement

      fireEvent.change(qtyInput, { target: { value: '2.5' } })
      expect(qtyInput.value).toBe('2.5')
    })

    it('resets invalid quantity to 1 on blur', async () => {
      await openQuickAdd()

      fireEvent.change(screen.getByLabelText('יחידה'), { target: { value: 'ליטר' } })
      const qtyInput = screen.getByLabelText('כמות') as HTMLInputElement

      fireEvent.change(qtyInput, { target: { value: '' } })
      fireEvent.blur(qtyInput)
      expect(qtyInput.value).toBe('1')

      fireEvent.change(qtyInput, { target: { value: 'abc' } })
      fireEvent.blur(qtyInput)
      expect(qtyInput.value).toBe('1')
    })

    it('submits without quantity/unit when ללא is selected', async () => {
      await openQuickAdd()

      const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
      fetchMock.mockImplementation((url: string, opts?: RequestInit) => {
        if (url.includes('/api/lists/list1/items') && opts?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ id: 'new-item', displayName: 'test' }),
          })
        }
        if (url.includes('/api/lists/list1/items')) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockItems) })
        }
        if (url.includes('/api/lists/list1')) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockList) })
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
      })

      // Unit is already ללא by default; fill the name and submit
      const nameInput = screen.getByPlaceholderText('שם פריט')
      fireEvent.change(nameInput, { target: { value: 'פריט חדש' } })
      fireEvent.submit(nameInput.closest('form')!)

      await waitFor(() => {
        const postCall = (fetchMock.mock.calls as [string, RequestInit | undefined][]).find(
          ([url, opts]) =>
            url.includes('/api/lists/list1/items') && opts?.method === 'POST'
        )
        expect(postCall).toBeDefined()
        const body = JSON.parse(postCall![1]!.body as string)
        expect(body.customNameHe).toBe('פריט חדש')
        expect(body.quantity).toBeUndefined()
        expect(body.unit).toBeUndefined()
      })
    })

    it('submits with quantity and unit when a unit is selected', async () => {
      await openQuickAdd()

      const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
      fetchMock.mockImplementation((url: string, opts?: RequestInit) => {
        if (url.includes('/api/lists/list1/items') && opts?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ id: 'new-item', displayName: 'test' }),
          })
        }
        if (url.includes('/api/lists/list1/items')) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockItems) })
        }
        if (url.includes('/api/lists/list1')) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockList) })
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
      })

      // Select a unit and set quantity
      fireEvent.change(screen.getByLabelText('יחידה'), { target: { value: 'ק"ג' } })
      const qtyInput = screen.getByLabelText('כמות') as HTMLInputElement
      fireEvent.change(qtyInput, { target: { value: '3' } })

      const nameInput = screen.getByPlaceholderText('שם פריט')
      fireEvent.change(nameInput, { target: { value: 'עגבניות' } })
      fireEvent.submit(nameInput.closest('form')!)

      await waitFor(() => {
        const postCall = (fetchMock.mock.calls as [string, RequestInit | undefined][]).find(
          ([url, opts]) =>
            url.includes('/api/lists/list1/items') && opts?.method === 'POST'
        )
        expect(postCall).toBeDefined()
        const body = JSON.parse(postCall![1]!.body as string)
        expect(body.customNameHe).toBe('עגבניות')
        expect(body.quantity).toBe(3)
        expect(body.unit).toBe('ק"ג')
      })
    })
  })
})
