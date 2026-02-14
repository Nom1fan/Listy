package com.listyyy.backend.workspace;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, WorkspaceMemberId> {

    List<WorkspaceMember> findByUserId(UUID userId);

    List<WorkspaceMember> findByWorkspaceId(UUID workspaceId);

    /** Fetch members with their User eagerly loaded to avoid N+1 queries. */
    @Query("SELECT m FROM WorkspaceMember m JOIN FETCH m.user WHERE m.workspaceId = :workspaceId")
    List<WorkspaceMember> findByWorkspaceIdWithUser(UUID workspaceId);

    /** Fetch all memberships for a user with roles eagerly loaded (avoids N+1 on listWorkspaces). */
    @Query("SELECT m FROM WorkspaceMember m WHERE m.userId = :userId")
    List<WorkspaceMember> findByUserIdWithRole(UUID userId);

    Optional<WorkspaceMember> findByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);

    boolean existsByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);

    @Modifying
    @Query("DELETE FROM WorkspaceMember m WHERE m.workspaceId = :workspaceId")
    void deleteByWorkspaceId(UUID workspaceId);

    @Query("SELECT m.workspaceId, COUNT(m) FROM WorkspaceMember m GROUP BY m.workspaceId")
    List<Object[]> countMembersByWorkspace();
}
