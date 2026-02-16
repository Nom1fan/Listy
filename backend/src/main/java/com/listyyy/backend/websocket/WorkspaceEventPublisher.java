package com.listyyy.backend.websocket;

import com.listyyy.backend.auth.User;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Publishes workspace-level events (category/product/list/workspace changes)
 * to all subscribers on /topic/workspaces/{workspaceId}.
 */
@Service
@RequiredArgsConstructor
public class WorkspaceEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void publish(UUID workspaceId, WorkspaceEvent.EntityType entityType,
                        WorkspaceEvent.Action action, UUID entityId, String entityName, User user) {
        WorkspaceEvent event = WorkspaceEvent.builder()
                .entityType(entityType)
                .action(action)
                .workspaceId(workspaceId)
                .entityId(entityId)
                .entityName(entityName)
                .userId(user.getId())
                .userDisplayName(getUserDisplayName(user))
                .build();
        messagingTemplate.convertAndSend("/topic/workspaces/" + workspaceId, event);
    }

    private static String getUserDisplayName(User user) {
        if (user.getDisplayName() != null) return user.getDisplayName();
        if (user.getEmail() != null) return user.getEmail();
        return user.getPhone();
    }
}
