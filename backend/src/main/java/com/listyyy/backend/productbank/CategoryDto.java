package com.listyyy.backend.productbank;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class CategoryDto {

    private UUID id;
    private UUID workspaceId;
    private String nameHe;
    private String iconId;
    private String imageUrl;
    private int sortOrder;
    /** Total number of list-item adds for products in this category (for sorting by frequency). */
    private long addCount;
    /** Optimistic-locking version. */
    private Long version;
}
