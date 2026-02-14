package com.listyyy.backend.list;

import lombok.Data;

@Data
public class CreateListRequest {

    private String name;
    private String iconId;
    private String imageUrl;
    private java.util.UUID workspaceId;
}
