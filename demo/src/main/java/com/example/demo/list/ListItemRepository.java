package com.example.demo.list;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface ListItemRepository extends JpaRepository<ListItem, UUID> {

    @Query("SELECT i FROM ListItem i LEFT JOIN FETCH i.product p LEFT JOIN FETCH p.category WHERE i.list.id = :listId ORDER BY i.sortOrder, i.createdAt")
    List<ListItem> findByListIdWithProductAndCategory(UUID listId);

    /** Distinct category IDs of products used on this list (for auto-sharing categories when list is shared). */
    @Query("SELECT DISTINCT p.category.id FROM ListItem i JOIN i.product p WHERE i.list.id = :listId")
    List<UUID> findDistinctCategoryIdsByListId(UUID listId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM ListItem i WHERE i.list.id = :listId")
    void deleteByListId(UUID listId);

    /** Count of list items per product (only rows with product_id set). Returns [productId, count] per row. */
    @Query(value = "SELECT li.product_id, COUNT(*) FROM list_items li WHERE li.product_id IS NOT NULL GROUP BY li.product_id", nativeQuery = true)
    List<Object[]> countByProductId();

    /** Count of list items per category (via product). Returns [categoryId, count] per row. */
    @Query(value = "SELECT p.category_id, COUNT(li.id) FROM list_items li INNER JOIN products p ON li.product_id = p.id GROUP BY p.category_id", nativeQuery = true)
    List<Object[]> countByCategoryId();
}
