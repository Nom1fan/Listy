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

    Optional<WorkspaceMember> findByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);

    boolean existsByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);

    @Modifying
    @Query("DELETE FROM WorkspaceMember m WHERE m.workspaceId = :workspaceId")
    void deleteByWorkspaceId(UUID workspaceId);

    @Query("SELECT m.workspaceId, COUNT(m) FROM WorkspaceMember m GROUP BY m.workspaceId")
    List<Object[]> countMembersByWorkspace();
}
