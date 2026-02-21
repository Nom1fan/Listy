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
    private String categoryFilterMode;
    private List<UUID> categoryIds;
}