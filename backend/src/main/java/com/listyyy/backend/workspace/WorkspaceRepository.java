package com.listyyy.backend.workspace;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface WorkspaceRepository extends JpaRepository<Workspace, UUID> {

    /** Workspaces visible to user: where the user is a member (including owner). */
    @Query("SELECT DISTINCT w FROM Workspace w JOIN WorkspaceMember m ON m.workspaceId = w.id WHERE m.userId = :userId ORDER BY w.name ASC")
    List<Workspace> findVisibleToUser(UUID userId);
}
