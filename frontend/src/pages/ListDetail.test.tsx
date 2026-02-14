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
    localStorage.setItem('listyyy-view-mode', 'grid')
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
})
