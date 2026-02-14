import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { Login } from './Login'

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

describe('Login (email)', () => {
  const originalFetch = globalThis.fetch
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    queryClient.clear()
  })
  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('renders name, email fields and submit button', () => {
    render(<Wrapper><Login /></Wrapper>)
    expect(screen.getByText('שם')).toBeInTheDocument()
    expect(screen.getByText('אימייל')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'שלח קוד' })).toBeInTheDocument()
  })

  it('submit button is disabled when fields are empty', () => {
    render(<Wrapper><Login /></Wrapper>)
    expect(screen.getByRole('button', { name: 'שלח קוד' })).toBeDisabled()
  })

  it('submit button is disabled with invalid email format', async () => {
    const user = userEvent.setup()
    render(<Wrapper><Login /></Wrapper>)
    const [nameInput, emailInput] = screen.getAllByRole('textbox')
    await user.type(nameInput, 'Test User')
    await user.type(emailInput, 'notanemail')
    expect(screen.getByRole('button', { name: 'שלח קוד' })).toBeDisabled()
  })

  it('submit button is disabled with email but no name', async () => {
    const user = userEvent.setup()
    render(<Wrapper><Login /></Wrapper>)
    const [, emailInput] = screen.getAllByRole('textbox')
    await user.type(emailInput, 'test@example.com')
    expect(screen.getByRole('button', { name: 'שלח קוד' })).toBeDisabled()
  })

  it('submit button enables with valid email and name', async () => {
    const user = userEvent.setup()
    render(<Wrapper><Login /></Wrapper>)
    const [nameInput, emailInput] = screen.getAllByRole('textbox')
    await user.type(nameInput, 'Test User')
    await user.type(emailInput, 'test@example.com')
    expect(screen.getByRole('button', { name: 'שלח קוד' })).toBeEnabled()
  })

  it('shows link to phone login', () => {
    render(<Wrapper><Login /></Wrapper>)
    const link = screen.getByRole('link', { name: 'התחברות עם טלפון' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/login')
  })
})
