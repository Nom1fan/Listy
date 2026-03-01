package com.listyyy.backend.workspace;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class WorkspaceInvitationDto {

    private UUID workspaceId;
    private String workspaceName;
    private String inviterDisplayName;
    private Instant invitedAt;
}
