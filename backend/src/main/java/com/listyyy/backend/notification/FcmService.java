package com.listyyy.backend.notification;

import com.listyyy.backend.list.GroceryList;
import com.listyyy.backend.list.GroceryListRepository;
import com.listyyy.backend.workspace.WorkspaceMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Sends FCM push notifications to workspace members when a list is updated.
 * Configure FCM credentials (e.g. Firebase Admin SDK or FCM HTTP v1) to enable.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FcmService {

    private final FcmTokenRepository fcmTokenRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final GroceryListRepository groceryListRepository;

    public void notifyListUpdated(UUID listId, UUID excludeUserId, String title, String body) {
        GroceryList list = groceryListRepository.findById(listId).orElse(null);
        if (list == null) return;
        UUID workspaceId = list.getWorkspace().getId();
        workspaceMemberRepository.findByWorkspaceId(workspaceId).stream()
                .filter(m -> !m.getUserId().equals(excludeUserId))
                .flatMap(m -> fcmTokenRepository.findByUserId(m.getUserId()).stream())
                .forEach(token -> {
                    try {
                        sendFcm(token.getToken(), title, body);
                    } catch (Exception e) {
                        log.warn("Failed to send FCM to token {}", token.getId(), e);
                    }
                });
    }

    private void sendFcm(String fcmToken, String title, String body) {
        // TODO: integrate Firebase Admin SDK or FCM HTTP v1 API
        // When implemented: build message and send via FirebaseMessaging or HTTP
        log.debug("FCM would send to {}: {} - {}", fcmToken, title, body);
    }
}
