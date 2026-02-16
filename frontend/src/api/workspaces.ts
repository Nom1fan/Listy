import { api } from './client';
import type { WorkspaceDto, ListMemberDto } from '../types';

export async function getWorkspaces(): Promise<WorkspaceDto[]> {
  return api<WorkspaceDto[]>('/api/workspaces');
}

export async function getWorkspace(id: string): Promise<WorkspaceDto> {
  return api<WorkspaceDto>(`/api/workspaces/${id}`);
}

export async function createWorkspace(body: { name: string; iconId?: string | null }): Promise<WorkspaceDto> {
  return api<WorkspaceDto>('/api/workspaces', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateWorkspace(
  id: string,
  body: { name?: string; iconId?: string | null; version?: number }
): Promise<WorkspaceDto> {
  return api<WorkspaceDto>(`/api/workspaces/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteWorkspace(id: string): Promise<void> {
  return api<void>(`/api/workspaces/${id}`, { method: 'DELETE' });
}

export async function getWorkspaceMembers(workspaceId: string): Promise<ListMemberDto[]> {
  return api<ListMemberDto[]>(`/api/workspaces/${workspaceId}/members`);
}

export async function inviteWorkspaceMember(
  workspaceId: string,
  body: { email?: string; phone?: string }
): Promise<ListMemberDto> {
  return api<ListMemberDto>(`/api/workspaces/${workspaceId}/members`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function removeWorkspaceMember(workspaceId: string, memberUserId: string): Promise<void> {
  return api<void>(`/api/workspaces/${workspaceId}/members/${memberUserId}`, { method: 'DELETE' });
}
