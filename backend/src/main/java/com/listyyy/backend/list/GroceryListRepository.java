package com.listyyy.backend.list;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface GroceryListRepository extends JpaRepository<GroceryList, UUID> {

    List<GroceryList> findByWorkspaceIdOrderBySortOrder(UUID workspaceId);

    /** Lists visible to user: in any workspace the user is a member of. */
    @Query("SELECT l FROM GroceryList l " +
           "JOIN com.listyyy.backend.workspace.WorkspaceMember wm ON wm.workspaceId = l.workspace.id " +
           "WHERE wm.userId = :userId " +
           "ORDER BY l.sortOrder ASC")
    List<GroceryList> findVisibleToUser(UUID userId);
}
