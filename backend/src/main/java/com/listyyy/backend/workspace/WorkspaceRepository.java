package com.listyyy.backend.workspace;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface WorkspaceRepository extends JpaRepository<Workspace, UUID> {

    /** Workspaces visible to user: where the user is a member (including owner). */
    @Query("SELECT DISTINCT w FROM Workspace w JOIN WorkspaceMember m ON m.workspaceId = w.id WHERE m.userId = :userId ORDER BY w.name ASC")
    List<Workspace> findVisibleToUser(UUID userId);

    @Query("SELECT COUNT(w) > 0 FROM Workspace w JOIN WorkspaceMember m ON m.workspaceId = w.id WHERE m.userId = :userId AND w.name = :name")
    boolean existsVisibleToUserWithName(UUID userId, String name);

    @Query("SELECT COUNT(w) > 0 FROM Workspace w JOIN WorkspaceMember m ON m.workspaceId = w.id WHERE m.userId = :userId AND w.name = :name AND w.id <> :excludeId")
    boolean existsVisibleToUserWithNameAndIdNot(UUID userId, String name, UUID excludeId);
}
