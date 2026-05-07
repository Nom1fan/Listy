import type { CategoryDto, ListResponse, ProductDto } from '../types';

/**
 * Returns categories attached to the list. With no list or no attached
 * categories, returns an empty array — the list opts out of auto-completion
 * and "add from categories" surfaces.
 */
export function getFilteredCategories(
  allCategories: CategoryDto[],
  list: Pick<ListResponse, 'categoryIds'> | null | undefined
): CategoryDto[] {
  if (!list || !list.categoryIds || list.categoryIds.length === 0) return [];
  const idSet = new Set(list.categoryIds);
  return allCategories.filter((c) => idSet.has(c.id));
}

/**
 * Returns products in the categories attached to the list. With no list or no
 * attached categories, returns an empty array.
 */
export function getFilteredProducts(
  allProducts: ProductDto[],
  list: Pick<ListResponse, 'categoryIds'> | null | undefined
): ProductDto[] {
  if (!list || !list.categoryIds || list.categoryIds.length === 0) return [];
  const idSet = new Set(list.categoryIds);
  return allProducts.filter((p) => idSet.has(p.categoryId));
}
