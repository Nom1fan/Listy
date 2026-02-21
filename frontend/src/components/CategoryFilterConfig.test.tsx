import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CategoryFilterConfig } from './CategoryFilterConfig'
import type { CategoryDto, CategoryFilterMode } from '../types'

const categories: CategoryDto[] = [
  { id: 'c1', workspaceId: 'ws1', nameHe: 'מכולת', iconId: null, imageUrl: null, sortOrder: 0, addCount: 0, version: 0 },
  { id: 'c2', workspaceId: 'ws1', nameHe: 'ירקות', iconId: null, imageUrl: null, sortOrder: 1, addCount: 0, version: 0 },
  { id: 'c3', workspaceId: 'ws1', nameHe: 'ניקיון', iconId: null, imageUrl: null, sortOrder: 2, addCount: 0, version: 0 },
]

describe('CategoryFilterConfig', () => {
  it('renders mode buttons', () => {
    render(
      <CategoryFilterConfig
        mode="NONE"
        selectedIds={[]}
        categories={categories}
        onModeChange={() => {}}
        onSelectedIdsChange={() => {}}
      />
    )
    expect(screen.getByTestId('filter-mode-NONE')).toBeInTheDocument()
    expect(screen.getByTestId('filter-mode-INCLUDE')).toBeInTheDocument()
    expect(screen.getByTestId('filter-mode-EXCLUDE')).toBeInTheDocument()
  })

  it('does not show checkboxes when mode is NONE', () => {
    render(
      <CategoryFilterConfig
        mode="NONE"
        selectedIds={[]}
        categories={categories}
        onModeChange={() => {}}
        onSelectedIdsChange={() => {}}
      />
    )
    expect(screen.queryByTestId('category-checkboxes')).not.toBeInTheDocument()
  })

  it('shows checkboxes when mode is INCLUDE', () => {
    render(
      <CategoryFilterConfig
        mode="INCLUDE"
        selectedIds={[]}
        categories={categories}
        onModeChange={() => {}}
        onSelectedIdsChange={() => {}}
      />
    )
    expect(screen.getByTestId('category-checkboxes')).toBeInTheDocument()
    expect(screen.getByText('מכולת')).toBeInTheDocument()
    expect(screen.getByText('ירקות')).toBeInTheDocument()
    expect(screen.getByText('ניקיון')).toBeInTheDocument()
  })

  it('shows checkboxes when mode is EXCLUDE', () => {
    render(
      <CategoryFilterConfig
        mode="EXCLUDE"
        selectedIds={['c1']}
        categories={categories}
        onModeChange={() => {}}
        onSelectedIdsChange={() => {}}
      />
    )
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(3)
    expect(checkboxes[0]).toBeChecked()
    expect(checkboxes[1]).not.toBeChecked()
  })

  it('calls onModeChange when clicking mode button', () => {
    const onModeChange = vi.fn()
    render(
      <CategoryFilterConfig
        mode="NONE"
        selectedIds={[]}
        categories={categories}
        onModeChange={onModeChange}
        onSelectedIdsChange={() => {}}
      />
    )
    fireEvent.click(screen.getByTestId('filter-mode-INCLUDE'))
    expect(onModeChange).toHaveBeenCalledWith('INCLUDE')
  })

  it('clears selectedIds when switching to NONE', () => {
    const onSelectedIdsChange = vi.fn()
    render(
      <CategoryFilterConfig
        mode="INCLUDE"
        selectedIds={['c1']}
        categories={categories}
        onModeChange={() => {}}
        onSelectedIdsChange={onSelectedIdsChange}
      />
    )
    fireEvent.click(screen.getByTestId('filter-mode-NONE'))
    expect(onSelectedIdsChange).toHaveBeenCalledWith([])
  })

  it('toggles category selection', () => {
    const onSelectedIdsChange = vi.fn()
    render(
      <CategoryFilterConfig
        mode="INCLUDE"
        selectedIds={['c1']}
        categories={categories}
        onModeChange={() => {}}
        onSelectedIdsChange={onSelectedIdsChange}
      />
    )
    // Check c2
    fireEvent.click(screen.getAllByRole('checkbox')[1])
    expect(onSelectedIdsChange).toHaveBeenCalledWith(['c1', 'c2'])
  })

  it('unchecks category when already selected', () => {
    const onSelectedIdsChange = vi.fn()
    render(
      <CategoryFilterConfig
        mode="INCLUDE"
        selectedIds={['c1', 'c2']}
        categories={categories}
        onModeChange={() => {}}
        onSelectedIdsChange={onSelectedIdsChange}
      />
    )
    // Uncheck c1
    fireEvent.click(screen.getAllByRole('checkbox')[0])
    expect(onSelectedIdsChange).toHaveBeenCalledWith(['c2'])
  })
})
