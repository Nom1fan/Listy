import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { PhoneLogin } from './PhoneLogin'

vi.mock('../plugins/smsConsent', () => ({
  default: {
    startListening: vi.fn(() => new Promise(() => {})),
    stopListening: vi.fn(() => Promise.resolve()),
  },
  isNativeAndroid: vi.fn(() => false),
}))

import SmsConsent, { isNativeAndroid } from '../plugins/smsConsent'

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

/** Fill in the name and phone segments to make the form complete */
async function fillPhoneForm(user: ReturnType<typeof userEvent.setup>) {
  const nameInput = screen.getByPlaceholderText('השם שלך')
  const seg1 = screen.getByLabelText('קטע 1')
  const seg2 = screen.getByLabelText('קטע 2')
  await user.type(nameInput, 'Moshe')
  await user.type(seg1, '054')
  await user.type(seg2, '1234567')
}

describe('PhoneLogin', () => {
  const originalFetch = globalThis.fetch
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    queryClient.clear()
  })
  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('renders name field, phone fields, and submit button', () => {
    render(<Wrapper><PhoneLogin /></Wrapper>)
    expect(screen.getByText('שם')).toBeInTheDocument()
    expect(screen.getByLabelText('קוד מדינה')).toBeInTheDocument()
    expect(screen.getByLabelText('קטע 1')).toBeInTheDocument()
    expect(screen.getByLabelText('קטע 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'שלח קוד' })).toBeInTheDocument()
  })

  it('submit button is disabled when fields are empty', () => {
    render(<Wrapper><PhoneLogin /></Wrapper>)
    expect(screen.getByRole('button', { name: 'שלח קוד' })).toBeDisabled()
  })

  it('submit button is disabled when name is filled but phone is incomplete', async () => {
    const user = userEvent.setup()
    render(<Wrapper><PhoneLogin /></Wrapper>)
    await user.type(screen.getByPlaceholderText('השם שלך'), 'Moshe')
    expect(screen.getByRole('button', { name: 'שלח קוד' })).toBeDisabled()
  })

  it('submit button is disabled when phone is filled but name is empty', async () => {
    const user = userEvent.setup()
    render(<Wrapper><PhoneLogin /></Wrapper>)
    await user.type(screen.getByLabelText('קטע 1'), '054')
    await user.type(screen.getByLabelText('קטע 2'), '1234567')
    expect(screen.getByRole('button', { name: 'שלח קוד' })).toBeDisabled()
  })

  it('submit button enables when name and phone are complete', async () => {
    const user = userEvent.setup()
    render(<Wrapper><PhoneLogin /></Wrapper>)
    await fillPhoneForm(user)
    expect(screen.getByRole('button', { name: 'שלח קוד' })).toBeEnabled()
  })

  it('submitting OTP request shows code step with OTP input', async () => {
    const user = userEvent.setup()
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 204,
    })
    render(<Wrapper><PhoneLogin /></Wrapper>)
    await fillPhoneForm(user)
    await user.click(screen.getByRole('button', { name: 'שלח קוד' }))
    await waitFor(() => {
      expect(screen.getByText('מה הקוד שקיבלת?')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('קוד אימות')).toBeInTheDocument()
    expect(screen.getByText('החלף מספר')).toBeInTheDocument()
  })

  it('shows masked phone number in code step', async () => {
    const user = userEvent.setup()
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 204,
    })
    render(<Wrapper><PhoneLogin /></Wrapper>)
    await fillPhoneForm(user)
    await user.click(screen.getByRole('button', { name: 'שלח קוד' }))
    await waitFor(() => {
      expect(screen.getByText('05X-XXX4567')).toBeInTheDocument()
    })
  })

  it('strips local prefix 0 from phone number when requesting OTP', async () => {
    const user = userEvent.setup()
    ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 204,
    })
    render(<Wrapper><PhoneLogin /></Wrapper>)
    await fillPhoneForm(user)
    await user.click(screen.getByRole('button', { name: 'שלח קוד' }))
    await waitFor(() => {
      const body = JSON.parse((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body)
      // Should be +972541234567, not +9720541234567
      expect(body.phone).toBe('+972541234567')
    })
  })

  it('shows link to email login', () => {
    render(<Wrapper><PhoneLogin /></Wrapper>)
    const link = screen.getByRole('link', { name: 'התחברות עם אימייל' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/login/email')
  })

  describe('SMS auto-complete', () => {
    beforeEach(() => {
      vi.mocked(isNativeAndroid).mockReturnValue(false)
      vi.mocked(SmsConsent.startListening).mockClear()
      vi.mocked(SmsConsent.stopListening).mockClear()
    })

    async function goToCodeStep(user: ReturnType<typeof userEvent.setup>) {
      ;(globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 204,
      })
      render(<Wrapper><PhoneLogin /></Wrapper>)
      await fillPhoneForm(user)
      await user.click(screen.getByRole('button', { name: 'שלח קוד' }))
      await waitFor(() => {
        expect(screen.getByText('מה הקוד שקיבלת?')).toBeInTheDocument()
      })
    }

    it('calls SmsConsent.startListening on native Android', async () => {
      const user = userEvent.setup()
      vi.mocked(isNativeAndroid).mockReturnValue(true)
      vi.mocked(SmsConsent.startListening).mockReturnValue(new Promise(() => {}))

      await goToCodeStep(user)

      expect(SmsConsent.startListening).toHaveBeenCalled()
    })

    it('does not call SmsConsent.startListening in browser', async () => {
      const user = userEvent.setup()
      vi.mocked(isNativeAndroid).mockReturnValue(false)

      await goToCodeStep(user)

      expect(SmsConsent.startListening).not.toHaveBeenCalled()
    })

    it('auto-fills OTP code when native plugin resolves', async () => {
      const user = userEvent.setup()
      vi.mocked(isNativeAndroid).mockReturnValue(true)
      vi.mocked(SmsConsent.startListening).mockResolvedValue({ code: '123456' })

      // Mock the verify call that will be triggered by auto-complete
      ;(globalThis.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true, status: 204 })        // requestOtp
        .mockResolvedValueOnce({                                   // verifyOtp
          ok: true,
          json: () => Promise.resolve({ token: 't', userId: 1, displayName: 'Moshe' }),
        })

      render(<Wrapper><PhoneLogin /></Wrapper>)
      await fillPhoneForm(user)
      await user.click(screen.getByRole('button', { name: 'שלח קוד' }))

      await waitFor(() => {
        expect(screen.getByText('מה הקוד שקיבלת?')).toBeInTheDocument()
      })

      await waitFor(() => {
        const otpInput = screen.getByLabelText('קוד אימות') as HTMLInputElement
        expect(otpInput.value).toBe('123456')
      })
    })

    it('calls stopListening on cleanup when leaving code step', async () => {
      const user = userEvent.setup()
      vi.mocked(isNativeAndroid).mockReturnValue(true)
      vi.mocked(SmsConsent.startListening).mockReturnValue(new Promise(() => {}))

      await goToCodeStep(user)

      // Go back to phone step, triggering cleanup
      await user.click(screen.getByText('החלף מספר'))

      await waitFor(() => {
        expect(SmsConsent.stopListening).toHaveBeenCalled()
      })
    })
  })
})
