package com.listyyy.backend.workspace;

import lombok.Data;

@Data
public class UpdateWorkspaceRequest {
    private String name;
    private String iconId;
    /** Optimistic-locking version from the client; null skips the check. */
    private Long version;
}
