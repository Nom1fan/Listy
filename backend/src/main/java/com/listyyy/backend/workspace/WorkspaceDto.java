package com.listyyy.backend.workspace;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class WorkspaceDto {
    private UUID id;
    private String name;
    private String iconId;
    /** Number of members in this workspace. */
    private int memberCount;
    /** Role of the current user in this workspace. */
    private String role;
}
