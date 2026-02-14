package com.listyyy.backend.workspace;

import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class WorkspaceMemberId implements Serializable {
    private UUID workspaceId;
    private UUID userId;
}
