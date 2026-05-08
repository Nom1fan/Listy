package com.listyyy.backend.workspace;

import com.listyyy.backend.auth.User;
import com.listyyy.backend.auth.UserRepository;
import com.listyyy.backend.exception.AccessDeniedException;
import com.listyyy.backend.exception.ResourceNotFoundException;
import com.listyyy.backend.exception.VersionCheck;
import com.listyyy.backend.productbank.BuiltInProductCatalog;
import com.listyyy.backend.productbank.CategoryRepository;
import com.listyyy.backend.productbank.ProductRepository;
import com.listyyy.backend.sharing.InviteRequest;
import com.listyyy.backend.sharing.ListMemberDto;
import com.listyyy.backend.websocket.UserEventPublisher;
import com.listyyy.backend.websocket.WorkspaceEvent;
import com.listyyy.backend.websocket.WorkspaceEventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.listyyy.backend.notification.FcmService;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final WorkspaceInvitationRepository workspaceInvitationRepository;
    private final WorkspaceAccessService workspaceAccessService;
    private final UserRepository userRepository;
    private final WorkspaceEventPublisher workspaceEventPublisher;
    private final UserEventPublisher userEventPublisher;
    private final FcmService fcmService;
    private final BuiltInProductCatalog builtInProductCatalog;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

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
                        .version(w.getVersion())
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
        builtInProductCatalog.seedWorkspace(workspace);
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
        VersionCheck.check(req.getVersion(), workspace.getVersion());
        if (req.getName() != null && !req.getName().isBlank()) {
            String trimmedName = req.getName().trim();
            if (!trimmedName.equals(workspace.getName()) &&
                    workspaceRepository.existsVisibleToUserWithNameAndIdNot(user.getId(), trimmedName, workspaceId)) {
                throw new IllegalArgumentException("כבר קיים מרחב עבודה בשם זה");
            }
            workspace.setName(trimmedName);
        }
        if (req.getIconId() != null) workspace.setIconId(req.getIconId().isBlank() ? null : req.getIconId());
        workspace = workspaceRepository.save(workspace);
        workspaceEventPublisher.publish(workspace.getId(), WorkspaceEvent.EntityType.WORKSPACE,
                WorkspaceEvent.Action.UPDATED, workspace.getId(), workspace.getName(), user);
        return workspace;
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
        workspaceInvitationRepository.deleteByWorkspaceId(workspaceId);
        workspaceMemberRepository.deleteByWorkspaceId(workspaceId);
        categoryRepository.findByWorkspaceId(workspaceId).forEach(category -> {
            productRepository.deleteAll(productRepository.findByCategoryIdOrderByNameHe(category.getId()));
            categoryRepository.delete(category);
        });
        workspaceRepository.deleteById(workspaceId);
    }

    public List<ListMemberDto> getMembers(UUID workspaceId, User user) {
        workspaceAccessService.getWorkspaceOrThrow(workspaceId, user);
        List<ListMemberDto> list = workspaceMemberRepository.findByWorkspaceIdWithUser(workspaceId).stream()
                .map(m -> ListMemberDto.builder()
                        .userId(m.getUserId())
                        .displayName(m.getUser().getDisplayName())
                        .profileImageUrl(m.getUser().getProfileImageUrl())
                        .email(m.getUser().getEmail())
                        .phone(m.getUser().getPhone())
                        .role(m.getRole())
                        .pending(false)
                        .build())
                .collect(Collectors.toList());
        if (workspaceAccessService.isOwner(user, workspaceId)) {
            workspaceInvitationRepository.findByWorkspaceIdWithInviteeAndInviter(workspaceId).stream()
                    .map(inv -> ListMemberDto.builder()
                            .userId(inv.getInviteeUserId())
                            .displayName(inv.getInvitee().getDisplayName())
                            .profileImageUrl(inv.getInvitee().getProfileImageUrl())
                            .email(inv.getInvitee().getEmail())
                            .phone(inv.getInvitee().getPhone())
                            .role("editor")
                            .pending(true)
                            .invitedAt(inv.getCreatedAt())
                            .build())
                    .forEach(list::add);
        }
        return list;
    }

    @Transactional
    public ListMemberDto invite(UUID workspaceId, User user, InviteRequest req) {
        workspaceAccessService.getWorkspaceOrThrow(workspaceId, user);
        if (!workspaceAccessService.isOwner(user, workspaceId)) {
            throw new AccessDeniedException("רק בעל המרחב יכול להזמין");
        }
        User invitee = resolveInvitee(req);
        if (invitee.getId().equals(user.getId())) throw new IllegalArgumentException("לא ניתן להזמין את עצמך");
        if (isSameUser(user, invitee, req)) throw new IllegalArgumentException("לא ניתן להזמין את עצמך");
        if (workspaceMemberRepository.existsByWorkspaceIdAndUserId(workspaceId, invitee.getId())) {
            throw new IllegalArgumentException("המשתמש כבר חבר במרחב");
        }
        if (workspaceInvitationRepository.existsByWorkspaceIdAndInviteeUserId(workspaceId, invitee.getId())) {
            throw new IllegalArgumentException("ההזמנה כבר נשלחה למשתמש זה");
        }
        Workspace workspace = workspaceRepository.findById(workspaceId).orElseThrow();
        WorkspaceInvitation inv = WorkspaceInvitation.builder()
                .workspaceId(workspaceId)
                .inviteeUserId(invitee.getId())
                .inviterUserId(user.getId())
                .workspace(workspace)
                .invitee(invitee)
                .inviter(user)
                .build();
        workspaceInvitationRepository.save(inv);
        String inviterName = user.getDisplayName() != null ? user.getDisplayName() : (user.getEmail() != null ? user.getEmail() : user.getPhone());
        fcmService.notifyWorkspaceInvited(invitee.getId(), workspaceId, workspace.getName(), inviterName != null ? inviterName : "מישהו");
        userEventPublisher.publishNewInvitation(invitee.getId());
        return ListMemberDto.builder()
                .userId(invitee.getId())
                .displayName(invitee.getDisplayName())
                .profileImageUrl(invitee.getProfileImageUrl())
                .email(invitee.getEmail())
                .phone(invitee.getPhone())
                .role("editor")
                .pending(true)
                .invitedAt(inv.getCreatedAt())
                .build();
    }

    public int getActiveMemberCount(UUID workspaceId) {
        return workspaceMemberRepository.findByWorkspaceId(workspaceId).size();
    }

    public List<WorkspaceInvitationDto> listMyInvitations(User user) {
        return workspaceInvitationRepository.findByInviteeUserIdWithWorkspaceAndInviter(user.getId()).stream()
                .map(i -> WorkspaceInvitationDto.builder()
                        .workspaceId(i.getWorkspaceId())
                        .workspaceName(i.getWorkspace().getName())
                        .inviterDisplayName(displayNameOf(i.getInviter()))
                        .invitedAt(i.getCreatedAt())
                        .build())
                .toList();
    }

    private static String displayNameOf(com.listyyy.backend.auth.User u) {
        if (u.getDisplayName() != null && !u.getDisplayName().isBlank()) return u.getDisplayName();
        if (u.getEmail() != null) return u.getEmail();
        return u.getPhone() != null ? u.getPhone() : "משתמש";
    }

    @Transactional
    public void acceptInvitation(UUID workspaceId, User user) {
        WorkspaceInvitation inv = workspaceInvitationRepository.findByWorkspaceIdAndInviteeUserId(workspaceId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("ההזמנה לא נמצאה או שפגה תוקפה"));
        Workspace workspace = workspaceRepository.findById(workspaceId).orElseThrow();
        UUID inviterUserId = inv.getInviterUserId();
        workspaceMemberRepository.save(WorkspaceMember.builder()
                .workspaceId(workspaceId)
                .userId(user.getId())
                .workspace(workspace)
                .user(user)
                .role("editor")
                .build());
        workspaceInvitationRepository.delete(inv);
        String inviteeName = user.getDisplayName() != null ? user.getDisplayName() : (user.getEmail() != null ? user.getEmail() : user.getPhone());
        fcmService.notifyInvitationAccepted(inviterUserId, workspaceId, workspace.getName(), inviteeName != null ? inviteeName : "משתמש");
        workspaceEventPublisher.publish(workspaceId, WorkspaceEvent.EntityType.WORKSPACE,
                WorkspaceEvent.Action.UPDATED, workspaceId, workspace.getName(), user);
    }

    @Transactional
    public void rejectInvitation(UUID workspaceId, User user) {
        WorkspaceInvitation inv = workspaceInvitationRepository.findByWorkspaceIdAndInviteeUserId(workspaceId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("ההזמנה לא נמצאה או שפגה תוקפה"));
        String inviteeDisplayName = displayNameOf(user);
        workspaceInvitationRepository.delete(inv);
        workspaceEventPublisher.publish(workspaceId, WorkspaceEvent.EntityType.INVITATION,
                WorkspaceEvent.Action.REJECTED, user.getId(), inviteeDisplayName != null ? inviteeDisplayName : "משתמש", user);
    }

    @Transactional
    public void cancelInvitation(UUID workspaceId, UUID inviteeUserId, User user) {
        Workspace workspace = workspaceAccessService.getWorkspaceOrThrow(workspaceId, user);
        if (!workspaceAccessService.isOwner(user, workspaceId)) {
            throw new AccessDeniedException("רק בעל המרחב יכול לבטל הזמנה");
        }
        WorkspaceInvitation inv = workspaceInvitationRepository.findByWorkspaceIdAndInviteeUserId(workspaceId, inviteeUserId)
                .orElseThrow(() -> new ResourceNotFoundException("ההזמנה לא נמצאה"));
        workspaceInvitationRepository.delete(inv);
        workspaceEventPublisher.publish(workspaceId, WorkspaceEvent.EntityType.WORKSPACE,
                WorkspaceEvent.Action.UPDATED, workspaceId, workspace.getName(), user);
    }

    @Transactional
    public void removeMember(UUID workspaceId, UUID memberUserId, User user) {
        Workspace workspace = workspaceAccessService.getWorkspaceOrThrow(workspaceId, user);
        WorkspaceMember target = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, memberUserId)
                .orElseThrow(() -> new ResourceNotFoundException("החבר לא נמצא"));
        if ("owner".equals(target.getRole())) {
            throw new IllegalArgumentException("לא ניתן להסיר את בעל המרחב");
        }
        if (!workspaceAccessService.isOwner(user, workspaceId) && !user.getId().equals(memberUserId)) {
            throw new AccessDeniedException("רק בעל המרחב יכול להסיר אחרים");
        }
        workspaceMemberRepository.deleteById(new WorkspaceMemberId(workspaceId, memberUserId));
        workspaceEventPublisher.publish(workspaceId, WorkspaceEvent.EntityType.WORKSPACE,
                WorkspaceEvent.Action.UPDATED, workspaceId, workspace.getName(), user);
        userEventPublisher.publishRemovedFromWorkspace(memberUserId, workspaceId);
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

    private boolean isSameUser(User current, User invitee, InviteRequest req) {
        if (current.getId().equals(invitee.getId())) return true;
        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            String e = req.getEmail().trim();
            return e.equalsIgnoreCase(current.getEmail());
        }
        if (req.getPhone() != null && !req.getPhone().isBlank()) {
            String normalized = com.listyyy.backend.auth.PhoneNormalizer.normalize(req.getPhone());
            return normalized.equals(com.listyyy.backend.auth.PhoneNormalizer.normalize(current.getPhone()));
        }
        return false;
    }
}
