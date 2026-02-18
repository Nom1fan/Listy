import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
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
  version: 0,
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
    version: 0,
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
    version: 0,
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

    it('sends latest version even if cache was updated while modal was open', async () => {
      mockFetchWithCategories()
      render(
        <Wrapper>
          <ListDetail />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })

      // Open edit modal for item1 (version 0)
      fireEvent.click(screen.getByText('חלב'))
      await waitFor(() => {
        expect(screen.getByText('עריכת פריט')).toBeInTheDocument()
      })

      // Simulate a background version bump (e.g. crossedOff toggle refetch)
      const updatedItems = mockItems.map((i) =>
        i.id === 'item1' ? { ...i, version: 5 } : i
      )
      await act(async () => {
        queryClient.setQueryData(['listItems', 'list1'], updatedItems)
        // Flush microtasks so React Query notifies subscribers
        await new Promise((r) => setTimeout(r, 0))
      })
      // Extra render cycle for the useEffect -> setEditItem chain
      await act(async () => {})

      // Now set up fetch mock to capture the PATCH call
      const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
      fetchMock.mockImplementation((url: string, opts?: RequestInit) => {
        if (opts?.method === 'PATCH') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ ...updatedItems[0], version: 6 }),
          })
        }
        if (url.includes('/api/lists/list1/items')) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(updatedItems) })
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

      // Change note and submit the edit form
      const noteArea = screen.getByPlaceholderText('אופציונלי') as HTMLTextAreaElement
      await act(async () => {
        fireEvent.change(noteArea, { target: { value: 'הערה חדשה' } })
      })
      await act(async () => {
        fireEvent.submit(noteArea.closest('form')!)
        await new Promise((r) => setTimeout(r, 0))
      })

      await waitFor(() => {
        const calls = fetchMock.mock.calls as [string, RequestInit | undefined][]
        const patchCall = calls.find(
          ([url, opts]) => opts?.method === 'PATCH' && url.includes('/items/')
        )
        expect(patchCall).toBeDefined()
        const body = JSON.parse(patchCall![1]!.body as string)
        // Should use the updated version (5), not the original (0)
        expect(body.version).toBe(5)
      })
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

  describe('hide crossed-off items toggle', () => {
    const mockItemsWithCrossedOff = [
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
        version: 0,
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
        crossedOff: true,
        itemImageUrl: null,
        productImageUrl: null,
        sortOrder: 1,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        version: 0,
      },
      {
        id: 'item3',
        listId: 'list1',
        productId: 'p3',
        customNameHe: null,
        displayName: 'גבינה',
        categoryId: 'c1',
        categoryNameHe: 'מוצרי חלב',
        categoryIconId: 'dairy',
        iconId: null,
        quantity: 1,
        unit: 'יחידה',
        note: null,
        crossedOff: true,
        itemImageUrl: null,
        productImageUrl: null,
        sortOrder: 2,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        version: 0,
      },
    ]

    function mockFetchCrossedOff(itemsOverride = mockItemsWithCrossedOff) {
      const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
      fetchMock.mockImplementation((url: string) => {
        if (url.includes('/api/lists/list1/items')) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(itemsOverride) })
        }
        if (url.includes('/api/lists/list1')) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockList) })
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
      })
    }

    it('does not show eye toggle when no items are crossed off', async () => {
      mockFetch()
      render(
        <Wrapper>
          <ListDetail />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })
      expect(screen.queryByRole('button', { name: /הסתר פריטים מסומנים/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /הצג פריטים מסומנים/i })).not.toBeInTheDocument()
    })

    it('shows eye toggle when at least one item is crossed off', async () => {
      mockFetchCrossedOff()
      render(
        <Wrapper>
          <ListDetail />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })
      expect(screen.getByRole('button', { name: /הסתר פריטים מסומנים/i })).toBeInTheDocument()
    })

    it('hides crossed-off items when eye toggle is clicked', async () => {
      mockFetchCrossedOff()
      render(
        <Wrapper>
          <ListDetail />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })

      // All items visible initially
      expect(screen.getByText('חלב')).toBeInTheDocument()
      expect(screen.getByText('לחם')).toBeInTheDocument()
      expect(screen.getByText('גבינה')).toBeInTheDocument()

      // Click eye toggle to hide crossed-off items
      fireEvent.click(screen.getByRole('button', { name: /הסתר פריטים מסומנים/i }))

      // Crossed-off items should be hidden
      expect(screen.getByText('חלב')).toBeInTheDocument()
      expect(screen.queryByText('לחם')).not.toBeInTheDocument()
      expect(screen.queryByText('גבינה')).not.toBeInTheDocument()
    })

    it('shows crossed-off items again when toggled back', async () => {
      mockFetchCrossedOff()
      render(
        <Wrapper>
          <ListDetail />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })

      // Hide crossed-off items
      fireEvent.click(screen.getByRole('button', { name: /הסתר פריטים מסומנים/i }))
      expect(screen.queryByText('לחם')).not.toBeInTheDocument()

      // Toggle back to show them
      fireEvent.click(screen.getByRole('button', { name: /הצג פריטים מסומנים/i }))
      expect(screen.getByText('לחם')).toBeInTheDocument()
      expect(screen.getByText('גבינה')).toBeInTheDocument()
    })

    it('hides entire category section when all its items are crossed off', async () => {
      mockFetchCrossedOff()
      render(
        <Wrapper>
          <ListDetail />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })

      // Both category headers visible initially
      expect(screen.getByText('מוצרי חלב')).toBeInTheDocument()
      expect(screen.getByText('מאפים')).toBeInTheDocument()

      // Hide crossed-off items — "לחם" is the only item in "מאפים" and it's crossed off
      fireEvent.click(screen.getByRole('button', { name: /הסתר פריטים מסומנים/i }))

      // "מוצרי חלב" category should still show (has non-crossed-off "חלב")
      expect(screen.getByText('מוצרי חלב')).toBeInTheDocument()
      // "מאפים" category should be hidden (all items crossed off)
      expect(screen.queryByText('מאפים')).not.toBeInTheDocument()
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

  describe('search within list', () => {
    it('shows search input when items exist', async () => {
      mockFetch()
      render(
        <Wrapper>
          <ListDetail />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })
      expect(screen.getByPlaceholderText('חיפוש ברשימה...')).toBeInTheDocument()
    })

    it('does not show search input when list is empty', async () => {
      const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
      fetchMock.mockImplementation((url: string) => {
        if (url.includes('/api/lists/list1/items')) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
        }
        if (url.includes('/api/lists/list1')) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockList) })
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
      })
      render(
        <Wrapper>
          <ListDetail />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('הרשימה ריקה — הוסיפו פריטים לרשימה')).toBeInTheDocument()
      })
      expect(screen.queryByPlaceholderText('חיפוש ברשימה...')).not.toBeInTheDocument()
    })

    it('filters items by display name', async () => {
      mockFetch()
      render(
        <Wrapper>
          <ListDetail />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })
      expect(screen.getByText('לחם')).toBeInTheDocument()

      const searchInput = screen.getByPlaceholderText('חיפוש ברשימה...')
      fireEvent.change(searchInput, { target: { value: 'חלב' } })

      expect(screen.getByText('חלב')).toBeInTheDocument()
      expect(screen.queryByText('לחם')).not.toBeInTheDocument()
    })

    it('filters items by note', async () => {
      mockFetch()
      render(
        <Wrapper>
          <ListDetail />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('חיפוש ברשימה...')
      fireEvent.change(searchInput, { target: { value: 'מחיטה' } })

      expect(screen.getByText('לחם')).toBeInTheDocument()
      expect(screen.queryByText('חלב')).not.toBeInTheDocument()
    })

    it('shows no-results message when nothing matches', async () => {
      mockFetch()
      render(
        <Wrapper>
          <ListDetail />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('חיפוש ברשימה...')
      fireEvent.change(searchInput, { target: { value: 'שוקולד' } })

      expect(screen.queryByText('חלב')).not.toBeInTheDocument()
      expect(screen.queryByText('לחם')).not.toBeInTheDocument()
      expect(screen.getByText('לא נמצאו פריטים תואמים')).toBeInTheDocument()
    })

    it('clears search and restores all items when clear button is clicked', async () => {
      mockFetch()
      render(
        <Wrapper>
          <ListDetail />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('חיפוש ברשימה...')
      fireEvent.change(searchInput, { target: { value: 'חלב' } })
      expect(screen.queryByText('לחם')).not.toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /נקה חיפוש/i }))

      expect(screen.getByText('חלב')).toBeInTheDocument()
      expect(screen.getByText('לחם')).toBeInTheDocument()
      expect((searchInput as HTMLInputElement).value).toBe('')
    })

    it('hides category header when all its items are filtered out', async () => {
      mockFetch()
      render(
        <Wrapper>
          <ListDetail />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })

      expect(screen.getByText('מוצרי חלב')).toBeInTheDocument()
      expect(screen.getByText('מאפים')).toBeInTheDocument()

      const searchInput = screen.getByPlaceholderText('חיפוש ברשימה...')
      fireEvent.change(searchInput, { target: { value: 'חלב' } })

      expect(screen.getByText('מוצרי חלב')).toBeInTheDocument()
      expect(screen.queryByText('מאפים')).not.toBeInTheDocument()
    })

    it('search is case-insensitive', async () => {
      mockFetch()
      render(
        <Wrapper>
          <ListDetail />
        </Wrapper>
      )
      await waitFor(() => {
        expect(screen.getByText('חלב')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('חיפוש ברשימה...')
      fireEvent.change(searchInput, { target: { value: 'מחיטה מלאה' } })

      expect(screen.getByText('לחם')).toBeInTheDocument()
      expect(screen.queryByText('חלב')).not.toBeInTheDocument()
    })
  })

  describe('quick-add dialog – autocomplete', () => {
    const mockProducts = [
      { id: 'p1', nameHe: 'חלב', defaultUnit: 'ליטר', categoryId: 'c1', categoryNameHe: 'מוצרי חלב', categoryIconId: 'dairy', iconId: null, imageUrl: null, note: null, addCount: 5, version: 1 },
      { id: 'p2', nameHe: 'חלב סויה', defaultUnit: 'ליטר', categoryId: 'c2', categoryNameHe: 'טבעוני', categoryIconId: null, iconId: null, imageUrl: null, note: null, addCount: 1, version: 1 },
      { id: 'p3', nameHe: 'לחם', defaultUnit: 'יחידה', categoryId: 'c3', categoryNameHe: 'מאפים', categoryIconId: 'bakery', iconId: null, imageUrl: null, note: null, addCount: 10, version: 1 },
    ]

    const mockCats = [
      { id: 'c1', nameHe: 'מוצרי חלב', iconId: 'dairy', imageUrl: null, sortOrder: 0, workspaceId: 'ws1', version: 1 },
      { id: 'c2', nameHe: 'טבעוני', iconId: null, imageUrl: null, sortOrder: 1, workspaceId: 'ws1', version: 1 },
      { id: 'c3', nameHe: 'מאפים', iconId: 'bakery', imageUrl: null, sortOrder: 2, workspaceId: 'ws1', version: 1 },
    ]

    function mockFetchWithProducts() {
      const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
      fetchMock.mockImplementation((url: string) => {
        if (url.includes('/api/lists/list1/items')) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockItems) })
        }
        if (url.includes('/api/lists/list1')) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockList) })
        }
        if (url.includes('/api/categories')) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockCats) })
        }
        if (url.includes('/api/products')) {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(mockProducts) })
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
      })
    }

    async function openQuickAddWithProducts() {
      mockFetchWithProducts()
      // Pre-seed products into React Query cache so autocomplete has data immediately
      queryClient.setQueryData(['products'], mockProducts)
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

    it('shows autocomplete suggestions when typing 2+ characters', async () => {
      await openQuickAddWithProducts()
      const nameInput = screen.getByPlaceholderText('שם פריט')
      fireEvent.change(nameInput, { target: { value: 'סוי' } })

      // "חלב סויה" should appear in the autocomplete dropdown
      expect(screen.getByText('חלב סויה')).toBeInTheDocument()
      // "טבעוני" appears both in the dropdown AND category select; verify at least 2 instances
      expect(screen.getAllByText('טבעוני').length).toBeGreaterThanOrEqual(2)
    })

    it('does not show autocomplete with only 1 character', async () => {
      await openQuickAddWithProducts()
      const nameInput = screen.getByPlaceholderText('שם פריט')
      fireEvent.change(nameInput, { target: { value: 'ס' } })

      // No suggestion dropdown should appear
      expect(screen.queryByText('חלב סויה')).not.toBeInTheDocument()
    })

    it('auto-fills category when selecting a suggestion', async () => {
      await openQuickAddWithProducts()
      const nameInput = screen.getByPlaceholderText('שם פריט')

      // Verify category starts unselected
      const catSelect = screen.getByDisplayValue('ללא קטגוריה (אחר)') as HTMLSelectElement
      expect(catSelect.value).toBe('')

      fireEvent.change(nameInput, { target: { value: 'סוי' } })
      expect(screen.getByText('חלב סויה')).toBeInTheDocument()

      // Click on "חלב סויה" suggestion (product in category c2)
      fireEvent.mouseDown(screen.getByText('חלב סויה'))

      // Category dropdown should now be set to the product's category
      await waitFor(() => {
        expect(catSelect.value).toBe('c2')
      })
    })

    it('does not show non-matching products in autocomplete', async () => {
      await openQuickAddWithProducts()
      const nameInput = screen.getByPlaceholderText('שם פריט')
      fireEvent.change(nameInput, { target: { value: 'סוי' } })

      // Should show "חלב סויה" (contains "סוי")
      expect(screen.getByText('חלב סויה')).toBeInTheDocument()
      // "לחם" exists in the background items list but should NOT appear in the dropdown;
      // verify only 1 instance (the list item), not 2 (which would mean it's also in autocomplete)
      expect(screen.getAllByText('לחם').length).toBe(1)
    })
  })
})
