package com.listyyy.backend.list;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
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
    private Instant createdAt;
    private Instant updatedAt;
    /** Optimistic-locking version. */
    private Long version;
}
