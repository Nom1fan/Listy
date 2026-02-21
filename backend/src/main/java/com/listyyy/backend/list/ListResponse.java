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
    private String categoryFilterMode;
    private List<UUID> categoryIds;
    private Instant createdAt;
    private Instant updatedAt;
    /** Optimistic-locking version. */
    private Long version;
}
