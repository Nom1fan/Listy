package com.listyyy.backend.workspace;

import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class WorkspaceInvitationId implements Serializable {
    private UUID workspaceId;
    private UUID inviteeUserId;
}
