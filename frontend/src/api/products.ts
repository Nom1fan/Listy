import { api } from './client';
import type { CategoryDto, ProductDto } from '../types';

export async function getCategories(workspaceId?: string): Promise<CategoryDto[]> {
  const params = new URLSearchParams();
  if (workspaceId) params.set('workspaceId', workspaceId);
  const q = params.toString();
  return api<CategoryDto[]>(`/api/categories${q ? '?' + q : ''}`);
}

export async function getCategory(id: string): Promise<CategoryDto> {
  return api<CategoryDto>(`/api/categories/${id}`);
}

export async function createCategory(body: { nameHe: string; iconId?: string | null; imageUrl?: string | null; sortOrder?: number; workspaceId: string }): Promise<CategoryDto> {
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

export async function createProduct(body: { categoryId: string; nameHe: string; defaultUnit?: string; iconId?: string | null; imageUrl?: string | null; note?: string | null }): Promise<ProductDto> {
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
  body: { nameHe?: string; defaultUnit?: string; imageUrl?: string | null; iconId?: string | null; note?: string | null }
): Promise<ProductDto> {
  // Only send fields that were explicitly provided (undefined = no change on backend)
  const payload: Record<string, string | null> = {};
  if (body.nameHe !== undefined) payload.nameHe = body.nameHe;
  if (body.defaultUnit !== undefined) payload.defaultUnit = body.defaultUnit;
  if (body.imageUrl !== undefined) payload.imageUrl = body.imageUrl;
  if (body.iconId !== undefined) payload.iconId = body.iconId;
  if (body.note !== undefined) payload.note = body.note;
  return api<ProductDto>(`/api/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
