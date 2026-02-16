package com.listyyy.backend.websocket;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

/**
 * Event broadcast over WebSocket when any entity inside a workspace changes.
 * Subscribers receive this on /topic/workspaces/{workspaceId}.
 */
@Data
@Builder
public class WorkspaceEvent {

    public enum EntityType { WORKSPACE, CATEGORY, PRODUCT, LIST }
    public enum Action { CREATED, UPDATED, DELETED }

    private EntityType entityType;
    private Action action;
    private UUID workspaceId;
    private UUID entityId;
    private String entityName;
    private UUID userId;
    private String userDisplayName;
}
