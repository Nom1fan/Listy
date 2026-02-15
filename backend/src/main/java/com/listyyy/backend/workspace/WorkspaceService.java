package com.listyyy.backend.workspace;

import com.listyyy.backend.auth.User;
import com.listyyy.backend.auth.UserRepository;
import com.listyyy.backend.exception.AccessDeniedException;
import com.listyyy.backend.exception.ResourceNotFoundException;
import com.listyyy.backend.sharing.InviteRequest;
import com.listyyy.backend.sharing.ListMemberDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final WorkspaceAccessService workspaceAccessService;
    private final UserRepository userRepository;

    public List<WorkspaceDto> listWorkspaces(User user) {
        List<Workspace> workspaces = workspaceRepository.findVisibleToUser(user.getId());
        Map<UUID, Integer> memberCounts = workspaceMemberRepository.countMembersByWorkspace().stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> ((Number) row[1]).intValue()
                ));
        // Batch-load user roles to avoid N+1 queries (one per workspace)
        Map<UUID, String> rolesByWorkspace = workspaceMemberRepository.findByUserIdWithRole(user.getId()).stream()
                .collect(Collectors.toMap(WorkspaceMember::getWorkspaceId, WorkspaceMember::getRole));
        return workspaces.stream()
                .map(w -> WorkspaceDto.builder()
                        .id(w.getId())
                        .name(w.getName())
                        .iconId(w.getIconId())
                        .memberCount(memberCounts.getOrDefault(w.getId(), 1))
                        .role(rolesByWorkspace.getOrDefault(w.getId(), null))
                        .build())
                .toList();
    }

    @Transactional
    public Workspace createWorkspace(User user, String name, String iconId) {
        String trimmedName = name.trim();
        if (workspaceRepository.existsVisibleToUserWithName(user.getId(), trimmedName)) {
            throw new IllegalArgumentException("כבר קיים מרחב עבודה בשם זה");
        }
        Workspace workspace = Workspace.builder()
                .name(trimmedName)
                .iconId(iconId)
                .build();
        workspace = workspaceRepository.save(workspace);
        WorkspaceMember member = WorkspaceMember.builder()
                .workspaceId(workspace.getId())
                .userId(user.getId())
                .workspace(workspace)
                .user(user)
                .role("owner")
                .build();
        workspaceMemberRepository.save(member);
        return workspace;
    }

    /**
     * Create a default workspace for a new user. Called during registration/OTP signup.
     */
    @Transactional
    public Workspace createDefaultWorkspace(User user) {
        return createWorkspace(user, "הרשימות שלי", null);
    }

    @Transactional
    public Workspace updateWorkspace(UUID workspaceId, User user, UpdateWorkspaceRequest req) {
        Workspace workspace = workspaceAccessService.getWorkspaceOrThrow(workspaceId, user);
        if (!workspaceAccessService.isOwner(user, workspaceId)) {
            throw new AccessDeniedException("רק בעל המרחב יכול לערוך");
        }
        if (req.getName() != null && !req.getName().isBlank()) {
            String trimmedName = req.getName().trim();
            if (!trimmedName.equals(workspace.getName()) &&
                    workspaceRepository.existsVisibleToUserWithNameAndIdNot(user.getId(), trimmedName, workspaceId)) {
                throw new IllegalArgumentException("כבר קיים מרחב עבודה בשם זה");
            }
            workspace.setName(trimmedName);
        }
        if (req.getIconId() != null) workspace.setIconId(req.getIconId().isBlank() ? null : req.getIconId());
        return workspaceRepository.save(workspace);
    }

    @Transactional
    public void deleteWorkspace(UUID workspaceId, User user) {
        workspaceAccessService.getWorkspaceOrThrow(workspaceId, user);
        if (!workspaceAccessService.isOwner(user, workspaceId)) {
            throw new AccessDeniedException("רק בעל המרחב יכול למחוק");
        }
        // Check this isn't the user's only workspace
        List<Workspace> userWorkspaces = workspaceRepository.findVisibleToUser(user.getId());
        if (userWorkspaces.size() <= 1) {
            throw new IllegalArgumentException("לא ניתן למחוק את המרחב האחרון שלך");
        }
        workspaceMemberRepository.deleteByWorkspaceId(workspaceId);
        workspaceRepository.deleteById(workspaceId);
    }

    public List<ListMemberDto> getMembers(UUID workspaceId, User user) {
        workspaceAccessService.getWorkspaceOrThrow(workspaceId, user);
        return workspaceMemberRepository.findByWorkspaceIdWithUser(workspaceId).stream()
                .map(m -> ListMemberDto.builder()
                        .userId(m.getUserId())
                        .displayName(m.getUser().getDisplayName())
                        .profileImageUrl(m.getUser().getProfileImageUrl())
                        .email(m.getUser().getEmail())
                        .phone(m.getUser().getPhone())
                        .role(m.getRole())
                        .build())
                .toList();
    }

    @Transactional
    public ListMemberDto invite(UUID workspaceId, User user, InviteRequest req) {
        workspaceAccessService.getWorkspaceOrThrow(workspaceId, user);
        if (!workspaceAccessService.isOwner(user, workspaceId)) {
            throw new AccessDeniedException("רק בעל המרחב יכול להזמין");
        }
        User invitee = resolveInvitee(req);
        if (invitee.getId().equals(user.getId())) throw new IllegalArgumentException("לא ניתן להזמין את עצמך");
        if (workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, invitee.getId())) {
            throw new IllegalArgumentException("המשתמש כבר חבר במרחב");
        }
        Workspace workspace = workspaceRepository.findById(workspaceId).orElseThrow();
        WorkspaceMember member = WorkspaceMember.builder()
                .workspaceId(workspaceId)
                .userId(invitee.getId())
                .workspace(workspace)
                .user(invitee)
                .role("editor")
                .build();
        workspaceMemberRepository.save(member);
        return ListMemberDto.builder()
                .userId(invitee.getId())
                .displayName(invitee.getDisplayName())
                .profileImageUrl(invitee.getProfileImageUrl())
                .email(invitee.getEmail())
                .phone(invitee.getPhone())
                .role("editor")
                .build();
    }

    @Transactional
    public void removeMember(UUID workspaceId, UUID memberUserId, User user) {
        workspaceAccessService.getWorkspaceOrThrow(workspaceId, user);
        WorkspaceMember target = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, memberUserId)
                .orElseThrow(() -> new ResourceNotFoundException("החבר לא נמצא"));
        if ("owner".equals(target.getRole())) {
            throw new IllegalArgumentException("לא ניתן להסיר את בעל המרחב");
        }
        if (!workspaceAccessService.isOwner(user, workspaceId) && !user.getId().equals(memberUserId)) {
            throw new AccessDeniedException("רק בעל המרחב יכול להסיר אחרים");
        }
        workspaceMemberRepository.deleteById(new WorkspaceMemberId(workspaceId, memberUserId));
    }

    private User resolveInvitee(InviteRequest req) {
        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            return userRepository.findByEmail(req.getEmail().trim())
                    .orElseThrow(() -> new ResourceNotFoundException("לא נמצא משתמש עם אימייל זה"));
        }
        if (req.getPhone() != null && !req.getPhone().isBlank()) {
            String normalized = com.listyyy.backend.auth.PhoneNormalizer.normalize(req.getPhone());
            return userRepository.findByPhone(normalized)
                    .orElseThrow(() -> new ResourceNotFoundException("לא נמצא משתמש עם מספר טלפון זה"));
        }
        throw new IllegalArgumentException("יש להזין אימייל או טלפון");
    }
}
