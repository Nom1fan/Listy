package com.listyyy.backend.list;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CreateListRequest {

    private String name;
    private String iconId;
    private String imageUrl;
    private UUID workspaceId;
    /** Categories to attach to the list. Empty/null means no categories attached. */
    private List<UUID> categoryIds;
}
