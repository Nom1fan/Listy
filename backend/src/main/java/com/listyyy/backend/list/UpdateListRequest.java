package com.listyyy.backend.list;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class UpdateListRequest {

    private String name;
    private String iconId;
    private String imageUrl;
    /** Optimistic-locking version from the client; null skips the check. */
    private Long version;
    /**
     * Categories to attach to the list. When non-null, replaces the current
     * attached set (empty list detaches all). When null, the attached set
     * is left unchanged.
     */
    private List<UUID> categoryIds;
}
