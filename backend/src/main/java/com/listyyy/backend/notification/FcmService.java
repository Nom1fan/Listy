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

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FcmService {

    private final FcmTokenRepository fcmTokenRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final GroceryListRepository groceryListRepository;

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
        Message message = Message.builder()
                .setToken(fcmToken)
                .setNotification(Notification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .build())
                .build();
        FirebaseMessaging.getInstance().send(message);
    }
}
