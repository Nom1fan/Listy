import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageSearchPicker } from './ImageSearchPicker'
import * as imagesApi from '../api/images'

describe('ImageSearchPicker', () => {
  beforeEach(() => {
    vi.spyOn(imagesApi, 'searchImages').mockResolvedValue([])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders search input and button', () => {
    const onSelect = vi.fn()
    render(<ImageSearchPicker onSelect={onSelect} />)
    expect(screen.getByPlaceholderText('חיפוש תמונות...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'חפש' })).toBeInTheDocument()
  })

  it('uses custom placeholder and triggers search on button click', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    vi.mocked(imagesApi.searchImages).mockResolvedValue([
      { url: 'https://a.com/1.jpg', thumbUrl: 'https://a.com/1-thumb.jpg' },
    ])
    const { container } = render(<ImageSearchPicker onSelect={onSelect} placeholder="Search images" />)
    await user.type(screen.getByPlaceholderText('Search images'), 'milk')
    await user.click(screen.getByRole('button', { name: 'חפש' }))
    await waitFor(() => {
      expect(imagesApi.searchImages).toHaveBeenCalledWith('milk', 12, 'giphy')
    })
    await waitFor(() => {
      expect(container.querySelector('img[src="https://a.com/1-thumb.jpg"]')).toBeInTheDocument()
    })
  })

  it('triggers search on Enter key', async () => {
    const user = userEvent.setup()
    vi.mocked(imagesApi.searchImages).mockResolvedValue([])
    render(<ImageSearchPicker onSelect={vi.fn()} />)
    const input = screen.getByPlaceholderText('חיפוש תמונות...')
    await user.type(input, 'bread{Enter}')
    await waitFor(() => {
      expect(imagesApi.searchImages).toHaveBeenCalledWith('bread', 12, 'giphy')
    })
  })

  it('calls onSelect when a result is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    vi.mocked(imagesApi.searchImages).mockResolvedValue([
      { url: 'https://b.com/full.jpg', thumbUrl: 'https://b.com/thumb.jpg' },
    ])
    const { container } = render(<ImageSearchPicker onSelect={onSelect} />)
    await user.type(screen.getByPlaceholderText('חיפוש תמונות...'), 'test')
    await user.click(screen.getByRole('button', { name: 'חפש' }))
    await waitFor(() => {
      expect(container.querySelector('img[src="https://b.com/thumb.jpg"]')).toBeInTheDocument()
    })
    const grid = container.querySelector('div[style*="grid"]')
    const resultButton = grid!.querySelector('button')!
    await user.click(resultButton)
    expect(onSelect).toHaveBeenCalledWith('https://b.com/full.jpg')
  })

  it('shows error when search fails', async () => {
    const user = userEvent.setup()
    vi.mocked(imagesApi.searchImages).mockRejectedValue(new Error('Network error'))
    render(<ImageSearchPicker onSelect={vi.fn()} />)
    await user.type(screen.getByPlaceholderText('חיפוש תמונות...'), 'x')
    await user.click(screen.getByRole('button', { name: 'חפש' }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network error')
    })
  })

  it('does not submit a parent form (search button is type=button)', () => {
    const onSelect = vi.fn()
    const formSubmit = vi.fn((e: React.FormEvent) => e.preventDefault())
    render(
      <form onSubmit={formSubmit}>
        <ImageSearchPicker onSelect={onSelect} />
      </form>
    )
    const btn = screen.getByRole('button', { name: 'חפש' })
    expect(btn).toHaveAttribute('type', 'button')
  })
})
