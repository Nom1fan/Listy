package com.listyyy.backend.list;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ListResponse {

    private UUID id;
    private String name;
    private UUID workspaceId;
    private String iconId;
    private String imageUrl;
    private int sortOrder;
    /** Categories currently attached to this list (empty when none). */
    private List<UUID> categoryIds;
    private Instant createdAt;
    private Instant updatedAt;
    /** Optimistic-locking version. */
    private Long version;
    /** Number of items on the list (included when listing lists). */
    private Integer itemCount;
}
