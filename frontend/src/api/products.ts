import { api } from './client';
import type { CategoryDto, ProductDto } from '../types';

export async function getCategories(): Promise<CategoryDto[]> {
  return api<CategoryDto[]>('/api/categories');
}

export async function createCategory(body: { nameHe: string; iconId?: string | null; imageUrl?: string | null; sortOrder?: number }): Promise<CategoryDto> {
  return api<CategoryDto>('/api/categories', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateCategory(
  id: string,
  body: { nameHe?: string; iconId?: string | null; imageUrl?: string | null; sortOrder?: number }
): Promise<CategoryDto> {
  return api<CategoryDto>(`/api/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  return api<void>(`/api/categories/${id}`, { method: 'DELETE' });
}

export async function getProducts(categoryId?: string, search?: string): Promise<ProductDto[]> {
  const params = new URLSearchParams();
  if (categoryId) params.set('categoryId', categoryId);
  if (search) params.set('search', search);
  const q = params.toString();
  return api<ProductDto[]>(`/api/products${q ? '?' + q : ''}`);
}

export async function createProduct(body: { categoryId: string; nameHe: string; defaultUnit?: string; iconId?: string | null; imageUrl?: string | null }): Promise<ProductDto> {
  return api<ProductDto>('/api/products', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  return api<void>(`/api/products/${id}`, { method: 'DELETE' });
}

export async function updateProduct(
  id: string,
  body: { imageUrl?: string | null; iconId?: string | null }
): Promise<ProductDto> {
  // Always send both keys so backend can clear image/icon when empty string
  const payload = {
    imageUrl: body.imageUrl ?? null,
    iconId: body.iconId ?? null,
  };
  return api<ProductDto>(`/api/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
