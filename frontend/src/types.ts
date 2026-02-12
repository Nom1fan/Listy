export interface AuthResponse {
  token: string;
  userId: string;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  locale: string;
}

export interface ListResponse {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListItemResponse {
  id: string;
  listId: string;
  productId: string | null;
  customNameHe: string | null;
  displayName: string;
  categoryId: string | null;
  categoryNameHe: string | null;
  categoryIconId: string | null;
  /** Product icon override when set; use iconId ?? categoryIconId for display */
  iconId?: string | null;
  quantity: number;
  unit: string;
  note: string | null;
  crossedOff: boolean;
  itemImageUrl: string | null;
  productImageUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryDto {
  id: string;
  nameHe: string;
  iconId: string | null;
  imageUrl: string | null;
  sortOrder: number;
  /** Total list-item adds for products in this category (for frequency sort). */
  addCount: number;
}

export interface ProductDto {
  id: string;
  categoryId: string;
  categoryNameHe: string;
  categoryIconId: string | null;
  /** Product-level icon override; when set, use this instead of categoryIconId */
  iconId?: string | null;
  nameHe: string;
  defaultUnit: string;
  imageUrl: string | null;
  /** Times this product was added to any list (for frequency sort). */
  addCount: number;
}

export interface ListEvent {
  type: 'ADDED' | 'REMOVED' | 'UPDATED';
  listId: string;
  itemId: string;
  itemDisplayName: string;
  quantityUnit: string;
  userId: string;
  userDisplayName: string;
}

export interface ListMemberDto {
  userId: string;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  role: string;
}
