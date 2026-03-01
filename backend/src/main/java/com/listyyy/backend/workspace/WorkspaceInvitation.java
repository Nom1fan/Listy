package com.listyyy.backend.workspace;

import com.listyyy.backend.auth.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workspace_invitations")
@IdClass(WorkspaceInvitationId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkspaceInvitation {

    @Id
    @Column(name = "workspace_id")
    private UUID workspaceId;

    @Id
    @Column(name = "invitee_user_id")
    private UUID inviteeUserId;

    @Column(name = "inviter_user_id", nullable = false)
    private UUID inviterUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false, insertable = false, updatable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invitee_user_id", nullable = false, insertable = false, updatable = false)
    private User invitee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inviter_user_id", nullable = false, insertable = false, updatable = false)
    private User inviter;

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;
}
