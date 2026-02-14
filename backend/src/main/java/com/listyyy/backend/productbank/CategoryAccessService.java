package com.listyyy.backend.productbank;

import com.listyyy.backend.auth.User;
import com.listyyy.backend.workspace.WorkspaceAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Access control for categories: a user can access a category if they are
 * a member of the workspace the category belongs to.
 */
@Service
@RequiredArgsConstructor
public class CategoryAccessService {

    private final CategoryRepository categoryRepository;
    private final WorkspaceAccessService workspaceAccessService;

    public boolean canAccess(User user, UUID categoryId) {
        if (user == null) return false;
        return categoryRepository.findById(categoryId)
                .map(c -> workspaceAccessService.canAccess(user, c.getWorkspace().getId()))
                .orElse(false);
    }

    public boolean canEdit(User user, UUID categoryId) {
        return canAccess(user, categoryId);
    }

    /** Only workspace owner can delete categories. */
    public boolean isWorkspaceOwner(User user, UUID categoryId) {
        if (user == null) return false;
        return categoryRepository.findById(categoryId)
                .map(c -> workspaceAccessService.isOwner(user, c.getWorkspace().getId()))
                .orElse(false);
    }

    public Category getCategoryOrThrow(UUID categoryId, User user) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("הקטגוריה לא נמצאה"));
        if (!canAccess(user, categoryId)) throw new IllegalArgumentException("אין גישה");
        return category;
    }
}
