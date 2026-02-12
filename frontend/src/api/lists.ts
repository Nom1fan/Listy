import { api } from './client';
import type { ListResponse, ListItemResponse, ListMemberDto } from '../types';

export async function getLists(): Promise<ListResponse[]> {
  return api<ListResponse[]>('/api/lists');
}

export async function createList(body: {
  name: string;
  iconId?: string | null;
  imageUrl?: string | null;
}): Promise<ListResponse> {
  return api<ListResponse>('/api/lists', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getList(listId: string): Promise<ListResponse> {
  return api<ListResponse>(`/api/lists/${listId}`);
}

export async function updateList(
  listId: string,
  body: { name?: string; iconId?: string | null; imageUrl?: string | null }
): Promise<ListResponse> {
  return api<ListResponse>(`/api/lists/${listId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteList(listId: string): Promise<void> {
  return api<void>(`/api/lists/${listId}`, { method: 'DELETE' });
}

export async function getListItems(listId: string): Promise<ListItemResponse[]> {
  return api<ListItemResponse[]>(`/api/lists/${listId}/items`);
}

export async function addListItem(
  listId: string,
  body: {
    productId?: string;
    customNameHe?: string;
    quantity?: number;
    unit?: string;
    note?: string;
    itemImageUrl?: string;
    iconId?: string;
  }
): Promise<ListItemResponse> {
  return api<ListItemResponse>(`/api/lists/${listId}/items`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateListItem(
  listId: string,
  itemId: string,
  body: {
    quantity?: number;
    unit?: string;
    note?: string;
    crossedOff?: boolean;
    customNameHe?: string;
    itemImageUrl?: string | null;
    iconId?: string | null;
  }
): Promise<ListItemResponse> {
  return api<ListItemResponse>(`/api/lists/${listId}/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function removeListItem(listId: string, itemId: string): Promise<void> {
  return api<void>(`/api/lists/${listId}/items/${itemId}`, { method: 'DELETE' });
}

// List sharing / members
export async function getListMembers(listId: string): Promise<ListMemberDto[]> {
  return api<ListMemberDto[]>(`/api/lists/${listId}/members`);
}

export async function inviteListMember(
  listId: string,
  body: { email?: string; phone?: string }
): Promise<ListMemberDto> {
  return api<ListMemberDto>(`/api/lists/${listId}/members`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function removeListMember(listId: string, memberUserId: string): Promise<void> {
  return api<void>(`/api/lists/${listId}/members/${memberUserId}`, { method: 'DELETE' });
}
