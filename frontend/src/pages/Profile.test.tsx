import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Profile } from './Profile'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/profile']}>
      <QueryClientProvider client={queryClient}>
        <Routes>
          <Route path="/profile" element={children} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('Profile', () => {
  const originalFetch = globalThis.fetch
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    queryClient.clear()
    useAuthStore.getState().setAuth({
      token: 'test-token',
      userId: 'u1',
      email: 'user@test.com',
      phone: null,
      displayName: 'Test User',
      profileImageUrl: null,
      locale: 'he',
    })
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('renders profile page with display name and image section', () => {
    render(
      <Wrapper>
        <Profile />
      </Wrapper>,
    )
    expect(screen.getByText('פרופיל')).toBeInTheDocument()
    expect(screen.getByText('שם לתצוגה')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'הוסף תמונה' })).toBeInTheDocument()
  })

  it('opening image source shows profile dialog with device, link, web only (no icon)', async () => {
    render(
      <Wrapper>
        <Profile />
      </Wrapper>,
    )
    expect(screen.queryByText('איך להוסיף תמונת פרופיל?')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'הוסף תמונה' }))
    await waitFor(() => {
      expect(screen.getByText('איך להוסיף תמונת פרופיל?')).toBeInTheDocument()
    })
    expect(screen.getByTestId('image-source-device')).toBeInTheDocument()
    expect(screen.getByTestId('image-source-link')).toBeInTheDocument()
    expect(screen.getByTestId('image-source-web')).toBeInTheDocument()
    expect(screen.queryByTestId('image-source-icon')).not.toBeInTheDocument()
  })

  it('choosing link in dialog shows link form; submitting URL closes dialog and sets image', async () => {
    render(
      <Wrapper>
        <Profile />
      </Wrapper>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'הוסף תמונה' }))
    await waitFor(() => {
      expect(screen.getByText('איך להוסיף תמונת פרופיל?')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId('image-source-link'))
    await waitFor(() => {
      expect(screen.getByTestId('image-source-link-input')).toBeInTheDocument()
    })
    fireEvent.change(screen.getByTestId('image-source-link-input'), {
      target: { value: 'https://example.com/avatar.png' },
    })
    fireEvent.click(screen.getByTestId('image-source-link-submit'))
    await waitFor(() => {
      expect(screen.queryByText('איך להוסיף תמונת פרופיל?')).not.toBeInTheDocument()
    })
    const img = screen.getByAltText('תמונת פרופיל')
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.png')
  })
})
