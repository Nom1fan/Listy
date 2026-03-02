package com.listyyy.backend.websocket;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

/**
 * Event sent to a single user on /topic/user/{userId}.
 * Used for new invitation (invitee) and removed from workspace (kicked user).
 */
@Data
@Builder
public class UserEvent {

    public enum Type { NEW_INVITATION, REMOVED_FROM_WORKSPACE }

    private Type type;
    private UUID workspaceId;
}
