package com.listyyy.backend.list;

import lombok.Data;

@Data
public class UpdateListRequest {

    private String name;
    private String iconId;
    private String imageUrl;
    /** Optimistic-locking version from the client; null skips the check. */
    private Long version;
}