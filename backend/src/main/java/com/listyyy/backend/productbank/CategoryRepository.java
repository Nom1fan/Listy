package com.listyyy.backend.productbank;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    List<Category> findAllByOrderBySortOrderAsc();

    List<Category> findByWorkspaceIdOrderBySortOrderAsc(UUID workspaceId);

    /** Categories visible to user: in any workspace the user is a member of. */
    @Query("SELECT DISTINCT c FROM Category c " +
           "JOIN com.listyyy.backend.workspace.WorkspaceMember wm ON wm.workspaceId = c.workspace.id " +
           "WHERE wm.userId = :userId " +
           "ORDER BY c.sortOrder ASC")
    List<Category> findVisibleToUser(UUID userId);

    /** Categories in a specific workspace. */
    @Query("SELECT c FROM Category c WHERE c.workspace.id = :workspaceId ORDER BY c.sortOrder ASC")
    List<Category> findByWorkspaceId(UUID workspaceId);

    boolean existsByWorkspaceIdAndNameHe(UUID workspaceId, String nameHe);

    boolean existsByWorkspaceIdAndNameHeAndIdNot(UUID workspaceId, String nameHe, UUID id);
}
