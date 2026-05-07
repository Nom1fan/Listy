import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SideMenu } from './SideMenu'
import { useSideMenuStore } from '../store/sideMenuStore'
import { useAuthStore } from '../store/authStore'

describe('SideMenu', () => {
  beforeEach(() => {
    useSideMenuStore.getState().close()
    useAuthStore.getState().setAuth({
      token: 't',
      userId: 'u1',
      email: 'a@b.c',
      phone: null,
      displayName: 'Test',
      profileImageUrl: null,
      locale: 'he',
    })
  })

  function renderOpen() {
    useSideMenuStore.getState().open()
    return render(
      <MemoryRouter>
        <SideMenu />
      </MemoryRouter>
    )
  }

  it('renders nothing when closed', () => {
    render(
      <MemoryRouter>
        <SideMenu />
      </MemoryRouter>
    )
    expect(screen.queryByRole('dialog', { name: /תפריט צד/i })).not.toBeInTheDocument()
  })

  it('shows the categories management link routing to /categories', () => {
    renderOpen()
    const link = screen.getByRole('link', { name: /ניהול קטגוריות/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/categories')
  })

  it('shows the profile, support, share, and about entries', () => {
    renderOpen()
    expect(screen.getByRole('link', { name: /הפרופיל שלי/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /פנייה לתמיכה/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /שיתוף האפליקציה/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /אודות/i })).toBeInTheDocument()
  })
})
