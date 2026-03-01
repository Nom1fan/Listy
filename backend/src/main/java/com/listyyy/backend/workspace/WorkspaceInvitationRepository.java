package com.listyyy.backend.workspace;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkspaceInvitationRepository extends JpaRepository<WorkspaceInvitation, WorkspaceInvitationId> {

    List<WorkspaceInvitation> findByInviteeUserId(UUID inviteeUserId);

    @Modifying
    @Query("DELETE FROM WorkspaceInvitation i WHERE i.workspaceId = :workspaceId")
    void deleteByWorkspaceId(UUID workspaceId);

    /** Fetch invitations for a user with workspace and inviter loaded. */
    @Query("SELECT i FROM WorkspaceInvitation i JOIN FETCH i.workspace JOIN FETCH i.inviter WHERE i.inviteeUserId = :inviteeUserId")
    List<WorkspaceInvitation> findByInviteeUserIdWithWorkspaceAndInviter(UUID inviteeUserId);

    List<WorkspaceInvitation> findByWorkspaceId(UUID workspaceId);

    @Query("SELECT i FROM WorkspaceInvitation i JOIN FETCH i.invitee JOIN FETCH i.inviter WHERE i.workspaceId = :workspaceId")
    List<WorkspaceInvitation> findByWorkspaceIdWithInviteeAndInviter(UUID workspaceId);

    Optional<WorkspaceInvitation> findByWorkspaceIdAndInviteeUserId(UUID workspaceId, UUID inviteeUserId);

    boolean existsByWorkspaceIdAndInviteeUserId(UUID workspaceId, UUID inviteeUserId);
}
