package com.listyyy.backend.notification;

import com.listyyy.backend.list.ListMemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Sends FCM push notifications to list members when list is updated.
 * Configure FCM credentials (e.g. Firebase Admin SDK or FCM HTTP v1) to enable.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FcmService {

    private final FcmTokenRepository fcmTokenRepository;
    private final ListMemberRepository listMemberRepository;

    public void notifyListUpdated(UUID listId, UUID excludeUserId, String title, String body) {
        listMemberRepository.findByListId(listId).stream()
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