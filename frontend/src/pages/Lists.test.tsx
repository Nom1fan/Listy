import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useWorkspaceStore } from '../store/workspaceStore'
import { Lists } from './Lists'
import { ListEdit } from './ListEdit'
import { ListCreate } from './ListCreate'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})

function Wrapper({ children, initialEntries = ['/lists'] }: { children: React.ReactNode; initialEntries?: string[] }) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/lists" element={children} />
          <Route path="/lists/:listId" element={<div>inside list</div>} />
          <Route path="/lists/new" element={<ListCreate />} />
          <Route path="/lists/:listId/edit" element={<ListEdit />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

const workspaceData = [
  { id: 'ws1', name: 'הרשימות שלי', iconId: null, memberCount: 1, role: 'owner' },
]

describe('Lists', () => {
  const originalFetch = globalThis.fetch
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    queryClient.clear()
    useAuthStore.getState().setAuth({
      token: 'test-token',
      userId: 'u1',
      email: 'test@test.com',
      phone: null,
      displayName: 'Test User',
      profileImageUrl: null,
      locale: 'he',
    })
    // Pre-set active workspace so we don't need to wait for auto-select
    useWorkspaceStore.getState().setActiveWorkspace('ws1')
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    useWorkspaceStore.getState().clearActiveWorkspace()
  })

  it('shows loading then lists when data returns', async () => {
    const fn = globalThis.fetch as ReturnType<typeof vi.fn>
    fn.mockImplementation((url: string) => {
      if (url.includes('/api/workspaces')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(workspaceData) })
      }
      if (url.includes('/api/lists')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ id: '1', name: 'List One', workspaceId: 'ws1', createdAt: '', updatedAt: '' }]),
        })
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
    })
    render(
      <Wrapper>
        <Lists />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText('List One')).toBeInTheDocument()
    })
    expect(screen.getByRole('link', { name: /List One/i })).toHaveAttribute('href', '/lists/1')
  })

  it('does not show categories tab on the home page', async () => {
    const fn = globalThis.fetch as ReturnType<typeof vi.fn>
    fn.mockImplementation((url: string) => {
      if (url.includes('/api/workspaces')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(workspaceData) })
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
    })
    render(
      <Wrapper>
        <Lists />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /הוסף רשימה/i })).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: 'קטגוריות' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'רשימות' })).not.toBeInTheDocument()
  })

  it('clicking FAB navigates to list create page', async () => {
    const fn = globalThis.fetch as ReturnType<typeof vi.fn>
    fn.mockImplementation((url: string) => {
      if (url.includes('/api/workspaces')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(workspaceData) })
      }
      if (url.includes('/api/lists')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
      }
      if (url.includes('/api/categories')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
    })
    render(
      <Wrapper>
        <Lists />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /הוסף רשימה/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('link', { name: /הוסף רשימה/i }))
    await waitFor(() => {
      expect(screen.getByText('רשימה חדשה')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('שם הרשימה')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /צור רשימה/i })).toBeInTheDocument()
      expect(screen.getByText('ביטול')).toBeInTheDocument()
    })
  })

  it('list row kebab has edit and delete; edit navigates to list edit page', async () => {
    const singleList = {
      id: 'list1',
      name: 'רשימה אחת',
      workspaceId: 'ws1',
      iconId: null,
      imageUrl: null,
      sortOrder: 0,
      categoryIds: [] as string[],
      createdAt: '',
      updatedAt: '',
      version: 0,
    }
    const fn = globalThis.fetch as ReturnType<typeof vi.fn>
    fn.mockImplementation((url: string) => {
      if (url.includes('/api/workspaces')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(workspaceData) })
      }
      if (url.includes('/api/lists/list1') && !url.includes('/api/lists/list1/')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(singleList) })
      }
      if (url.includes('/api/lists')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([singleList]),
        })
      }
      if (url.includes('/api/categories')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
    })
    render(
      <Wrapper>
        <Lists />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText('רשימה אחת')).toBeInTheDocument()
    })
    const kebab = screen.getByRole('button', { name: /תפריט רשימה/i })
    fireEvent.click(kebab)
    await waitFor(() => {
      expect(screen.getByText('ערוך')).toBeInTheDocument()
      expect(screen.getByText('מחק')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('ערוך'))
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'ערוך רשימה' })).toBeInTheDocument()
      expect(screen.getByPlaceholderText('שם הרשימה')).toHaveValue('רשימה אחת')
    })
  })

  it('opens plaintext dialog from non-empty list row menu after fetching list items', async () => {
    const singleList = {
      id: 'list1',
      name: 'רשימה אחת',
      workspaceId: 'ws1',
      iconId: null,
      imageUrl: null,
      sortOrder: 0,
      categoryIds: [] as string[],
      itemCount: 2,
      createdAt: '',
      updatedAt: '',
      version: 0,
    }
    const fn = globalThis.fetch as ReturnType<typeof vi.fn>
    fn.mockImplementation((url: string) => {
      if (url.includes('/api/workspaces')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(workspaceData) })
      }
      if (url.includes('/api/lists/list1/items')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([
            { id: 'item1', listId: 'list1', productId: null, customNameHe: null, displayName: 'חלב', categoryId: null, categoryNameHe: null, categoryIconId: null, quantity: 1, unit: 'יחידה', showQuantityUnit: false, note: null, crossedOff: false, itemImageUrl: null, productImageUrl: null, sortOrder: 0, createdAt: '', updatedAt: '', version: 0 },
            { id: 'item2', listId: 'list1', productId: null, customNameHe: null, displayName: 'לחם', categoryId: null, categoryNameHe: null, categoryIconId: null, quantity: 1, unit: 'יחידה', showQuantityUnit: false, note: null, crossedOff: false, itemImageUrl: null, productImageUrl: null, sortOrder: 1, createdAt: '', updatedAt: '', version: 0 },
          ]),
        })
      }
      if (url.includes('/api/lists')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([singleList]),
        })
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
    })
    render(
      <Wrapper>
        <Lists />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText('רשימה אחת')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /תפריט רשימה/i }))
    fireEvent.click(screen.getByRole('button', { name: 'הצג כטקסט' }))

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'רשימה כטקסט' })).toBeInTheDocument()
    })
    expect(screen.getByLabelText('פריטי הרשימה כטקסט')).toHaveValue('חלב\nלחם')
  })

  it('opens the non-empty list row menu on long press without navigating into the list', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const singleList = {
      id: 'list1',
      name: 'רשימה אחת',
      workspaceId: 'ws1',
      iconId: null,
      imageUrl: null,
      sortOrder: 0,
      categoryIds: [] as string[],
      itemCount: 1,
      createdAt: '',
      updatedAt: '',
      version: 0,
    }
    const fn = globalThis.fetch as ReturnType<typeof vi.fn>
    fn.mockImplementation((url: string) => {
      if (url.includes('/api/workspaces')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(workspaceData) })
      }
      if (url.includes('/api/lists')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([singleList]) })
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
    })
    render(
      <Wrapper>
        <Lists />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByText('רשימה אחת')).toBeInTheDocument()
    })

    const listLink = screen.getByRole('link', { name: /רשימה אחת/ })
    fireEvent.touchStart(listLink)
    await act(async () => {
      vi.advanceTimersByTime(550)
    })
    fireEvent.touchEnd(listLink)
    fireEvent.click(listLink)

    expect(screen.getByRole('button', { name: 'הצג כטקסט' })).toBeInTheDocument()
    expect(screen.queryByText('inside list')).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it('exit opens confirmation; cancel keeps session', async () => {
    const fn = globalThis.fetch as ReturnType<typeof vi.fn>
    fn.mockImplementation((url: string) => {
      if (url.includes('/api/workspaces')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(workspaceData) })
      }
      if (url.includes('/api/lists')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
    })
    render(
      <Wrapper>
        <Lists />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'יציאה' })).toBeInTheDocument()
    })
    expect(useAuthStore.getState().token).toBe('test-token')
    fireEvent.click(screen.getByRole('button', { name: 'יציאה' }))
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'התנתקות' })).toBeInTheDocument()
      expect(screen.getByText('האם ברצונך להתנתק מהחשבון?')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: 'לא' }))
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'התנתקות' })).not.toBeInTheDocument()
    })
    expect(useAuthStore.getState().token).toBe('test-token')
  })

  it('confirming exit logs out', async () => {
    const fn = globalThis.fetch as ReturnType<typeof vi.fn>
    fn.mockImplementation((url: string) => {
      if (url.includes('/api/auth/logout')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) })
      }
      if (url.includes('/api/workspaces')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(workspaceData) })
      }
      if (url.includes('/api/lists')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) })
    })
    render(
      <Wrapper>
        <Lists />
      </Wrapper>
    )
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'יציאה' })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: 'יציאה' }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'התנתק' })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: 'התנתק' }))
    await waitFor(() => {
      expect(useAuthStore.getState().token).toBeNull()
    })
    expect(fn).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/logout'),
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
