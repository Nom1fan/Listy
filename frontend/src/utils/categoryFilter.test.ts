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
  it('returns all categories when mode is NONE', () => {
    const result = getFilteredCategories(categories, { categoryFilterMode: 'NONE', categoryIds: [] })
    expect(result).toEqual(categories)
  })

  it('returns all categories when list is null', () => {
    expect(getFilteredCategories(categories, null)).toEqual(categories)
  })

  it('returns only included categories in INCLUDE mode', () => {
    const result = getFilteredCategories(categories, { categoryFilterMode: 'INCLUDE', categoryIds: ['c1', 'c3'] })
    expect(result).toHaveLength(2)
    expect(result.map((c) => c.id)).toEqual(['c1', 'c3'])
  })

  it('excludes specified categories in EXCLUDE mode', () => {
    const result = getFilteredCategories(categories, { categoryFilterMode: 'EXCLUDE', categoryIds: ['c2'] })
    expect(result).toHaveLength(2)
    expect(result.map((c) => c.id)).toEqual(['c1', 'c3'])
  })

  it('returns empty array when all categories are excluded', () => {
    const result = getFilteredCategories(categories, { categoryFilterMode: 'EXCLUDE', categoryIds: ['c1', 'c2', 'c3'] })
    expect(result).toHaveLength(0)
  })
})

describe('getFilteredProducts', () => {
  it('returns all products when mode is NONE', () => {
    expect(getFilteredProducts(products, { categoryFilterMode: 'NONE', categoryIds: [] })).toEqual(products)
  })

  it('returns all products when list is null', () => {
    expect(getFilteredProducts(products, null)).toEqual(products)
  })

  it('returns only products from included categories', () => {
    const result = getFilteredProducts(products, { categoryFilterMode: 'INCLUDE', categoryIds: ['c1'] })
    expect(result).toHaveLength(1)
    expect(result[0].nameHe).toBe('אורז')
  })

  it('excludes products from excluded categories', () => {
    const result = getFilteredProducts(products, { categoryFilterMode: 'EXCLUDE', categoryIds: ['c3'] })
    expect(result).toHaveLength(2)
    expect(result.map((p) => p.nameHe)).toEqual(['אורז', 'עגבנייה'])
  })
})
