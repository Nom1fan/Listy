package com.example.demo.productbank;

import com.example.demo.auth.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    List<Category> findAllByOrderBySortOrderAsc();

    List<Category> findByOwnerIdOrderBySortOrderAsc(UUID ownerId);

    /** Categories visible to user: owned by user or shared with user (member). */
    @Query("SELECT DISTINCT c FROM Category c LEFT JOIN FETCH c.owner LEFT JOIN CategoryMember m ON m.categoryId = c.id AND m.userId = :userId WHERE c.owner.id = :userId OR m.userId IS NOT NULL ORDER BY c.sortOrder ASC")
    List<Category> findVisibleToUser(UUID userId);
}
