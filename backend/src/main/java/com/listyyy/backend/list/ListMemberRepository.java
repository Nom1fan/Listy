package com.listyyy.backend.list;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ListMemberRepository extends JpaRepository<ListMember, ListMemberId> {

    @Query("SELECT m FROM ListMember m JOIN FETCH m.list l JOIN FETCH l.owner WHERE m.userId = :userId")
    List<ListMember> findByUserId(UUID userId);

    @Query("SELECT m FROM ListMember m JOIN FETCH m.user WHERE m.listId = :listId")
    List<ListMember> findByListId(UUID listId);

    Optional<ListMember> findByListIdAndUserId(UUID listId, UUID userId);

    boolean existsByListIdAndUserId(UUID listId, UUID userId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM ListMember m WHERE m.listId = :listId")
    void deleteByListId(UUID listId);
}
