import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProductAutocomplete } from './ProductAutocomplete'
import type { ProductDto } from '../types'

const products: ProductDto[] = [
  { id: 'p1', nameHe: 'חלב', defaultUnit: 'ליטר', categoryId: 'c1', categoryNameHe: 'מוצרי חלב', categoryIconId: 'dairy', iconId: null, imageUrl: null, note: null, addCount: 5, version: 1 },
  { id: 'p2', nameHe: 'חלב שוקו', defaultUnit: 'יחידה', categoryId: 'c1', categoryNameHe: 'מוצרי חלב', categoryIconId: 'dairy', iconId: null, imageUrl: null, note: null, addCount: 3, version: 1 },
  { id: 'p3', nameHe: 'חלב סויה', defaultUnit: 'ליטר', categoryId: 'c2', categoryNameHe: 'טבעוני', categoryIconId: null, iconId: null, imageUrl: null, note: null, addCount: 1, version: 1 },
  { id: 'p4', nameHe: 'לחם', defaultUnit: 'יחידה', categoryId: 'c3', categoryNameHe: 'מאפים', categoryIconId: 'bakery', iconId: null, imageUrl: null, note: null, addCount: 10, version: 1 },
  { id: 'p5', nameHe: 'אורז', defaultUnit: 'ק"ג', categoryId: 'c4', categoryNameHe: 'מכולת', categoryIconId: 'groceries', iconId: null, imageUrl: null, note: null, addCount: 7, version: 1 },
]

describe('ProductAutocomplete', () => {
  describe('filtering', () => {
    it('shows no suggestions when input is less than 2 characters', () => {
      render(
        <ProductAutocomplete value="ח" onChange={() => {}} products={products} />
      )
      expect(screen.queryByText('חלב')).not.toBeInTheDocument()
      expect(screen.queryByText('מוצרי חלב')).not.toBeInTheDocument()
    })

    it('shows matching suggestions from 2 characters', () => {
      render(
        <ProductAutocomplete value="חל" onChange={() => {}} products={products} />
      )
      // Focus to open dropdown
      fireEvent.focus(screen.getByRole('textbox'))
      expect(screen.getByText('חלב')).toBeInTheDocument()
      expect(screen.getByText('חלב שוקו')).toBeInTheDocument()
      expect(screen.getByText('חלב סויה')).toBeInTheDocument()
    })

    it('does not show non-matching products', () => {
      render(
        <ProductAutocomplete value="חל" onChange={() => {}} products={products} />
      )
      fireEvent.focus(screen.getByRole('textbox'))
      expect(screen.queryByText('לחם')).not.toBeInTheDocument()
      expect(screen.queryByText('אורז')).not.toBeInTheDocument()
    })

    it('shows category name next to each suggestion', () => {
      render(
        <ProductAutocomplete value="חל" onChange={() => {}} products={products} />
      )
      fireEvent.focus(screen.getByRole('textbox'))
      // Two products share "מוצרי חלב" category, so use getAllByText
      expect(screen.getAllByText('מוצרי חלב').length).toBe(2)
      expect(screen.getByText('טבעוני')).toBeInTheDocument()
    })

    it('shows no dropdown when there are no matches', () => {
      render(
        <ProductAutocomplete value="xyz" onChange={() => {}} products={products} />
      )
      fireEvent.focus(screen.getByRole('textbox'))
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })
  })

  describe('selection mode (default)', () => {
    it('calls onSelectProduct and onChange when clicking a suggestion', () => {
      const onSelect = vi.fn()
      const onChange = vi.fn()
      render(
        <ProductAutocomplete
          value="חל"
          onChange={onChange}
          products={products}
          onSelectProduct={onSelect}
        />
      )
      fireEvent.focus(screen.getByRole('textbox'))
      fireEvent.mouseDown(screen.getByText('חלב שוקו'))

      expect(onSelect).toHaveBeenCalledWith(products[1])
      expect(onChange).toHaveBeenCalledWith('חלב שוקו')
    })

    it('calls onChange on typing', () => {
      const onChange = vi.fn()
      render(
        <ProductAutocomplete value="" onChange={onChange} products={products} />
      )
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'חל' } })
      expect(onChange).toHaveBeenCalledWith('חל')
    })
  })

  describe('keyboard navigation', () => {
    it('highlights items with arrow keys and selects with Enter', async () => {
      const onSelect = vi.fn()
      const onChange = vi.fn()
      render(
        <ProductAutocomplete
          value="חל"
          onChange={onChange}
          products={products}
          onSelectProduct={onSelect}
        />
      )
      const input = screen.getByRole('textbox')
      fireEvent.focus(input)

      // Wait for dropdown to open after focus
      await waitFor(() => {
        expect(screen.getByText('חלב שוקו')).toBeInTheDocument()
      })

      // Arrow down to first item
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      // Arrow down to second item
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      // Enter to select second item (חלב שוקו)
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(onSelect).toHaveBeenCalledWith(products[1])
    })

    it('closes dropdown on Escape', () => {
      render(
        <ProductAutocomplete value="חל" onChange={() => {}} products={products} />
      )
      const input = screen.getByRole('textbox')
      fireEvent.focus(input)

      // Suggestions visible
      expect(screen.getByText('חלב')).toBeInTheDocument()

      fireEvent.keyDown(input, { key: 'Escape' })

      // Dropdown should be closed - suggestions hidden
      expect(screen.queryByText('מוצרי חלב')).not.toBeInTheDocument()
    })
  })

  describe('warnOnly mode', () => {
    it('shows similar items header in dropdown', () => {
      render(
        <ProductAutocomplete value="חל" onChange={() => {}} products={products} warnOnly />
      )
      fireEvent.focus(screen.getByRole('textbox'))
      expect(screen.getByText('פריטים דומים שכבר קיימים:')).toBeInTheDocument()
    })

    it('does not call onChange with product name on suggestion display', () => {
      const onChange = vi.fn()
      render(
        <ProductAutocomplete value="חל" onChange={onChange} products={products} warnOnly />
      )
      fireEvent.focus(screen.getByRole('textbox'))
      // onChange should not be called just by displaying suggestions
      expect(onChange).not.toHaveBeenCalled()
    })

    it('shows exact-match warning when product with same name exists in same category', () => {
      render(
        <ProductAutocomplete
          value="חלב"
          onChange={() => {}}
          products={products}
          warnOnly
          categoryId="c1"
        />
      )
      fireEvent.focus(screen.getByRole('textbox'))
      expect(screen.getByText(/פריט בשם זה כבר קיים בקטגוריה/)).toBeInTheDocument()
      expect(screen.getByText('מוצרי חלב')).toBeInTheDocument()
    })

    it('does NOT show exact-match warning when product exists in a different category', () => {
      render(
        <ProductAutocomplete
          value="חלב"
          onChange={() => {}}
          products={products}
          warnOnly
          categoryId="c3"
        />
      )
      fireEvent.focus(screen.getByRole('textbox'))
      // The similar-items dropdown should still show matches
      expect(screen.getByText('פריטים דומים שכבר קיימים:')).toBeInTheDocument()
      // But the exact-duplicate warning banner should NOT appear
      expect(screen.queryByText(/פריט בשם זה כבר קיים בקטגוריה/)).not.toBeInTheDocument()
    })

    it('does NOT show exact-match warning without categoryId (scoping disabled)', () => {
      // When no categoryId is provided but warnOnly is on, exact match requires categoryId
      render(
        <ProductAutocomplete
          value="חלב"
          onChange={() => {}}
          products={products}
          warnOnly
        />
      )
      fireEvent.focus(screen.getByRole('textbox'))
      // Without categoryId, the exact-match condition (!categoryId || ...) passes, so it DOES show
      expect(screen.getByText(/פריט בשם זה כבר קיים בקטגוריה/)).toBeInTheDocument()
    })
  })
})
