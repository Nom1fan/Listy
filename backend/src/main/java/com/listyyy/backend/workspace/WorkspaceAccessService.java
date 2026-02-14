package com.listyyy.backend.workspace;

import com.listyyy.backend.auth.User;
import com.listyyy.backend.exception.AccessDeniedException;
import com.listyyy.backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Access control for workspaces: a user can access a workspace if they are a member.
 */
@Service
@RequiredArgsConstructor
public class WorkspaceAccessService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

    public boolean canAccess(User user, UUID workspaceId) {
        if (user == null) return false;
        return workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, user.getId());
    }

    public boolean canEdit(User user, UUID workspaceId) {
        return canAccess(user, workspaceId);
    }

    /** Only workspace owner can delete workspace or manage members. */
    public boolean isOwner(User user, UUID workspaceId) {
        if (user == null) return false;
        return workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, user.getId())
                .map(m -> "owner".equals(m.getRole()))
                .orElse(false);
    }

    public Workspace getWorkspaceOrThrow(UUID workspaceId, User user) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("המרחב לא נמצא"));
        if (!canAccess(user, workspaceId)) throw new AccessDeniedException("אין גישה");
        return workspace;
    }

    /** Get the user's role in the workspace, or null if not a member. */
    public String getRole(User user, UUID workspaceId) {
        return workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, user.getId())
                .map(WorkspaceMember::getRole)
                .orElse(null);
    }
}
