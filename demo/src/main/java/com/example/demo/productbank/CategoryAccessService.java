package com.example.demo.productbank;

import com.example.demo.auth.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Access control for categories: a user can access a category if they are the owner
 * or a member (shared with them).
 */
@Service
@RequiredArgsConstructor
public class CategoryAccessService {

    private final CategoryRepository categoryRepository;
    private final CategoryMemberRepository categoryMemberRepository;

    public boolean canAccess(User user, UUID categoryId) {
        if (user == null) return false;
        return categoryRepository.findById(categoryId)
                .map(c -> c.getOwner().getId().equals(user.getId()) || categoryMemberRepository.existsByCategoryIdAndUserId(categoryId, user.getId()))
                .orElse(false);
    }

    public boolean canEdit(User user, UUID categoryId) {
        return canAccess(user, categoryId);
    }

    /** Only owner can delete category or manage members. */
    public boolean isOwner(User user, UUID categoryId) {
        if (user == null) return false;
        return categoryRepository.findById(categoryId)
                .map(c -> c.getOwner().getId().equals(user.getId()))
                .orElse(false);
    }

    public Category getCategoryOrThrow(UUID categoryId, User user) {
        Category category = categoryRepository.findById(categoryId).orElseThrow(() -> new IllegalArgumentException("Category not found"));
        if (!canAccess(user, categoryId)) throw new IllegalArgumentException("Access denied");
        return category;
    }
}
