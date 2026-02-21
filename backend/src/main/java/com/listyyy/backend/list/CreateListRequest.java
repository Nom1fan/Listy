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
    private String categoryFilterMode;
    private List<UUID> categoryIds;
}
