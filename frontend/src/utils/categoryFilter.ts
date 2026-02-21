import type { CategoryDto, CategoryFilterMode, ListResponse, ProductDto } from '../types';

export function getFilteredCategories(
  allCategories: CategoryDto[],
  list: Pick<ListResponse, 'categoryFilterMode' | 'categoryIds'> | null | undefined
): CategoryDto[] {
  if (!list || list.categoryFilterMode === 'NONE') return allCategories;
  const idSet = new Set(list.categoryIds);
  if (list.categoryFilterMode === 'INCLUDE') {
    return allCategories.filter((c) => idSet.has(c.id));
  }
  // EXCLUDE
  return allCategories.filter((c) => !idSet.has(c.id));
}

export function getFilteredProducts(
  allProducts: ProductDto[],
  list: Pick<ListResponse, 'categoryFilterMode' | 'categoryIds'> | null | undefined
): ProductDto[] {
  if (!list || list.categoryFilterMode === 'NONE') return allProducts;
  const idSet = new Set(list.categoryIds);
  if (list.categoryFilterMode === 'INCLUDE') {
    return allProducts.filter((p) => idSet.has(p.categoryId));
  }
  return allProducts.filter((p) => !idSet.has(p.categoryId));
}
