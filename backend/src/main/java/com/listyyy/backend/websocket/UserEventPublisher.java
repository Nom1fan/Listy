package com.listyyy.backend.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void publishNewInvitation(UUID userId) {
        messagingTemplate.convertAndSend("/topic/user/" + userId,
                UserEvent.builder().type(UserEvent.Type.NEW_INVITATION).build());
    }

    public void publishRemovedFromWorkspace(UUID userId, UUID workspaceId) {
        messagingTemplate.convertAndSend("/topic/user/" + userId,
                UserEvent.builder()
                        .type(UserEvent.Type.REMOVED_FROM_WORKSPACE)
                        .workspaceId(workspaceId)
                        .build());
    }
}
