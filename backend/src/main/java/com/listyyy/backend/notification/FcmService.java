package com.listyyy.backend.notification;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.MessagingErrorCode;
import com.google.firebase.messaging.Notification;
import com.listyyy.backend.list.GroceryList;
import com.listyyy.backend.list.GroceryListRepository;
import com.listyyy.backend.workspace.WorkspaceMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FcmService {

    private final FcmTokenRepository fcmTokenRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final GroceryListRepository groceryListRepository;

    @Async
    public void notifyWorkspaceInvited(UUID inviteeUserId, UUID workspaceId, String workspaceName, String inviterDisplayName) {
        if (FirebaseApp.getApps().isEmpty()) {
            log.warn("Push skipped (Firebase not initialized): workspace invite to {}", inviteeUserId);
            return;
        }
        String title = "הזמנה למרחב עבודה";
        String body = inviterDisplayName + " הזמין/ה אותך למרחב \"" + workspaceName + "\"";
        Map<String, String> data = Map.of("type", "workspace_invitation", "workspaceId", workspaceId.toString());
        sendToUser(inviteeUserId, title, body, data, "workspace_invitation");
    }

    @Async
    public void notifyInvitationAccepted(UUID inviterUserId, UUID workspaceId, String workspaceName, String inviteeDisplayName) {
        if (FirebaseApp.getApps().isEmpty()) {
            log.warn("Push skipped (Firebase not initialized): invitation accepted notify to {}", inviterUserId);
            return;
        }
        String title = "הזמנה אושרה";
        String body = inviteeDisplayName + " הצטרף/ה למרחב \"" + workspaceName + "\"";
        Map<String, String> data = Map.of("type", "invitation_accepted", "workspaceId", workspaceId.toString());
        sendToUser(inviterUserId, title, body, data, "invitation_accepted");
    }

    private void sendToUser(UUID userId, String title, String body) {
        sendToUser(userId, title, body, null, null);
    }

    private void sendToUser(UUID userId, String title, String body, Map<String, String> data, String context) {
        if (FirebaseApp.getApps().isEmpty()) return;
        var tokens = fcmTokenRepository.findByUserId(userId);
        if (tokens.isEmpty()) {
            log.warn("Push skipped (no FCM tokens for user {}): {}", userId, context != null ? context : "notification");
            return;
        }
        tokens.forEach(token -> {
            try {
                sendFcm(token.getToken(), title, body, data);
            } catch (FirebaseMessagingException e) {
                log.warn("Failed to send FCM to token {}: {}", token.getId(), e.getMessage());
                if (e.getMessagingErrorCode() == MessagingErrorCode.UNREGISTERED) {
                    fcmTokenRepository.delete(token);
                }
            }
        });
    }

    @Async
    public void notifyListUpdated(UUID listId, UUID excludeUserId, String title, String body) {
        if (FirebaseApp.getApps().isEmpty()) return;

        GroceryList list = groceryListRepository.findById(listId).orElse(null);
        if (list == null) return;
        UUID workspaceId = list.getWorkspace().getId();
        workspaceMemberRepository.findByWorkspaceId(workspaceId).stream()
                .filter(m -> !m.getUserId().equals(excludeUserId))
                .flatMap(m -> fcmTokenRepository.findByUserId(m.getUserId()).stream())
                .forEach(token -> {
                    try {
                        sendFcm(token.getToken(), title, body);
                    } catch (FirebaseMessagingException e) {
                        log.warn("Failed to send FCM to token {}: {}", token.getId(), e.getMessage());
                        if (e.getMessagingErrorCode() == MessagingErrorCode.UNREGISTERED) {
                            fcmTokenRepository.delete(token);
                        }
                    }
                });
    }

    private void sendFcm(String fcmToken, String title, String body) throws FirebaseMessagingException {
        sendFcm(fcmToken, title, body, null);
    }

    private void sendFcm(String fcmToken, String title, String body, Map<String, String> data) throws FirebaseMessagingException {
        Message.Builder builder = Message.builder()
                .setToken(fcmToken)
                .setNotification(Notification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .build());
        if (data != null && !data.isEmpty()) {
            builder.putAllData(data);
        }
        FirebaseMessaging.getInstance().send(builder.build());
    }
}
