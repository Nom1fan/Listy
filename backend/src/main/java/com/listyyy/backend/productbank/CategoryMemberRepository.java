package com.listyyy.backend.productbank;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryMemberRepository extends JpaRepository<CategoryMember, CategoryMemberId> {

    @Query("SELECT m FROM CategoryMember m JOIN FETCH m.category c JOIN FETCH c.owner WHERE m.userId = :userId")
    List<CategoryMember> findByUserId(UUID userId);

    @Query("SELECT m FROM CategoryMember m JOIN FETCH m.user WHERE m.categoryId = :categoryId")
    List<CategoryMember> findByCategoryId(UUID categoryId);

    Optional<CategoryMember> findByCategoryIdAndUserId(UUID categoryId, UUID userId);

    boolean existsByCategoryIdAndUserId(UUID categoryId, UUID userId);

    void deleteByCategoryId(UUID categoryId);

    @Query("SELECT m.categoryId, COUNT(m) FROM CategoryMember m GROUP BY m.categoryId")
    List<Object[]> countMembersByCategory();
}
