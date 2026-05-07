import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CategoryIcon } from './CategoryIcon'

describe('CategoryIcon', () => {
  it('renders emoji when iconId is set and no imageUrl', () => {
    render(<CategoryIcon iconId="dairy" imageUrl={null} size={32} />)
    expect(screen.getByText('🥛')).toBeInTheDocument()
  })

  it('renders default emoji when iconId is null', () => {
    render(<CategoryIcon iconId={null} imageUrl={null} size={32} />)
    expect(screen.getByText('📦')).toBeInTheDocument()
  })

  it('renders default emoji for unknown iconId', () => {
    render(<CategoryIcon iconId="unknown" imageUrl={null} size={32} />)
    expect(screen.getByText('📦')).toBeInTheDocument()
  })

  it('renders img when imageUrl is set', () => {
    const { container } = render(<CategoryIcon iconId="dairy" imageUrl="/uploads/cat/x.png" size={32} />)
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img).toHaveAttribute('src', expect.stringContaining('/uploads/cat/x.png'))
  })

  it('renders bundled asset img when iconId starts with asset:', () => {
    const { container } = render(<CategoryIcon iconId="asset:spray_bottle" imageUrl={null} size={32} />)
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    // Vite often inlines SVG imports as data: URIs in tests.
    expect(img).toHaveAttribute('src', expect.stringContaining('data:image/svg+xml'))
  })
})
