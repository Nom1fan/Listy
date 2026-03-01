package com.listyyy.backend.workspace;

import com.listyyy.backend.auth.User;
import com.listyyy.backend.sharing.InviteRequest;
import com.listyyy.backend.sharing.ListMemberDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceService workspaceService;
    private final WorkspaceAccessService workspaceAccessService;

    @GetMapping
    public ResponseEntity<List<WorkspaceDto>> list(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(workspaceService.listWorkspaces(user));
    }

    @GetMapping("/invitations")
    public ResponseEntity<List<WorkspaceInvitationDto>> listMyInvitations(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(workspaceService.listMyInvitations(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkspaceDto> get(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        Workspace w = workspaceAccessService.getWorkspaceOrThrow(id, user);
        String role = workspaceAccessService.getRole(user, id);
        int memberCount = workspaceService.getActiveMemberCount(id);
        return ResponseEntity.ok(WorkspaceDto.builder()
                .id(w.getId())
                .name(w.getName())
                .iconId(w.getIconId())
                .memberCount(memberCount)
                .role(role)
                .version(w.getVersion())
                .build());
    }

    @PostMapping
    public ResponseEntity<WorkspaceDto> create(
            @Valid @RequestBody CreateWorkspaceRequest req,
            @AuthenticationPrincipal User user
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        Workspace w = workspaceService.createWorkspace(user, req.getName(), req.getIconId());
        return ResponseEntity.ok(WorkspaceDto.builder()
                .id(w.getId())
                .name(w.getName())
                .iconId(w.getIconId())
                .memberCount(1)
                .role("owner")
                .version(w.getVersion())
                .build());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<WorkspaceDto> update(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            @RequestBody UpdateWorkspaceRequest req
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        Workspace w = workspaceService.updateWorkspace(id, user, req);
        String role = workspaceAccessService.getRole(user, id);
        int memberCount = workspaceService.getActiveMemberCount(id);
        return ResponseEntity.ok(WorkspaceDto.builder()
                .id(w.getId())
                .name(w.getName())
                .iconId(w.getIconId())
                .memberCount(memberCount)
                .role(role)
                .version(w.getVersion())
                .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        workspaceService.deleteWorkspace(id, user);
        return ResponseEntity.noContent().build();
    }

    // --- Members ---

    @GetMapping("/{id}/members")
    public ResponseEntity<List<ListMemberDto>> getMembers(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(workspaceService.getMembers(id, user));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<ListMemberDto> invite(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user,
            @Valid @RequestBody InviteRequest req
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(workspaceService.invite(id, user, req));
    }

    @DeleteMapping("/{id}/members/{memberUserId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID id,
            @PathVariable UUID memberUserId,
            @AuthenticationPrincipal User user
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        workspaceService.removeMember(id, memberUserId, user);
        return ResponseEntity.noContent().build();
    }

    // --- Invitations (invitee accept/reject; owner cancel) ---

    @PostMapping("/{id}/invitations/accept")
    public ResponseEntity<Void> acceptInvitation(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        workspaceService.acceptInvitation(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/invitations/reject")
    public ResponseEntity<Void> rejectInvitation(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        workspaceService.rejectInvitation(id, user);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/invitations/{inviteeUserId}")
    public ResponseEntity<Void> cancelInvitation(
            @PathVariable UUID id,
            @PathVariable UUID inviteeUserId,
            @AuthenticationPrincipal User user
    ) {
        if (user == null) return ResponseEntity.status(401).build();
        workspaceService.cancelInvitation(id, inviteeUserId, user);
        return ResponseEntity.noContent().build();
    }
}
