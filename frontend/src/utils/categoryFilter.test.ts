import { describe, it, expect } from 'vitest'
import { getFilteredCategories, getFilteredProducts } from './categoryFilter'
import type { CategoryDto, ProductDto } from '../types'

const categories: CategoryDto[] = [
  { id: 'c1', workspaceId: 'ws1', nameHe: 'מכולת', iconId: null, imageUrl: null, sortOrder: 0, addCount: 0, version: 0 },
  { id: 'c2', workspaceId: 'ws1', nameHe: 'ירקות', iconId: null, imageUrl: null, sortOrder: 1, addCount: 0, version: 0 },
  { id: 'c3', workspaceId: 'ws1', nameHe: 'ניקיון', iconId: null, imageUrl: null, sortOrder: 2, addCount: 0, version: 0 },
]

const products: ProductDto[] = [
  { id: 'p1', categoryId: 'c1', categoryNameHe: 'מכולת', categoryIconId: null, nameHe: 'אורז', defaultUnit: 'קילו', imageUrl: null, note: null, addCount: 0, version: 0 },
  { id: 'p2', categoryId: 'c2', categoryNameHe: 'ירקות', categoryIconId: null, nameHe: 'עגבנייה', defaultUnit: 'קילו', imageUrl: null, note: null, addCount: 0, version: 0 },
  { id: 'p3', categoryId: 'c3', categoryNameHe: 'ניקיון', categoryIconId: null, nameHe: 'סבון', defaultUnit: 'יחידה', imageUrl: null, note: null, addCount: 0, version: 0 },
]

describe('getFilteredCategories', () => {
  it('returns empty array when list is null', () => {
    expect(getFilteredCategories(categories, null)).toEqual([])
  })

  it('returns empty array when no categories are attached', () => {
    expect(getFilteredCategories(categories, { categoryIds: [] })).toEqual([])
  })

  it('returns only the attached categories', () => {
    const result = getFilteredCategories(categories, { categoryIds: ['c1', 'c3'] })
    expect(result).toHaveLength(2)
    expect(result.map((c) => c.id)).toEqual(['c1', 'c3'])
  })

  it('ignores attached ids that no longer exist', () => {
    const result = getFilteredCategories(categories, { categoryIds: ['c1', 'cX'] })
    expect(result.map((c) => c.id)).toEqual(['c1'])
  })
})

describe('getFilteredProducts', () => {
  it('returns empty array when list is null', () => {
    expect(getFilteredProducts(products, null)).toEqual([])
  })

  it('returns empty array when no categories are attached', () => {
    expect(getFilteredProducts(products, { categoryIds: [] })).toEqual([])
  })

  it('returns only products in the attached categories', () => {
    const result = getFilteredProducts(products, { categoryIds: ['c1'] })
    expect(result).toHaveLength(1)
    expect(result[0].nameHe).toBe('אורז')
  })

  it('returns products across multiple attached categories', () => {
    const result = getFilteredProducts(products, { categoryIds: ['c1', 'c2'] })
    expect(result.map((p) => p.nameHe)).toEqual(['אורז', 'עגבנייה'])
  })
})
