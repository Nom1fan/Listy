-- Workspace invitations: pending invites until invitee accepts.
-- Inviter creates invitation; invitee accepts (becomes member) or rejects.
CREATE TABLE workspace_invitations (
    workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    invitee_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    inviter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (workspace_id, invitee_user_id),
    CONSTRAINT no_self_invite CHECK (invitee_user_id <> inviter_user_id)
);

CREATE INDEX idx_workspace_invitations_invitee ON workspace_invitations(invitee_user_id);
