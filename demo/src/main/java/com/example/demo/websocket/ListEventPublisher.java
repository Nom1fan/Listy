package com.example.demo.websocket;

import com.example.demo.auth.User;
import com.example.demo.list.ListItem;
import com.example.demo.notification.FcmService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ListEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;
    private final FcmService fcmService;

    public void publishItemAdded(UUID listId, ListItem item, User user) {
        ListEvent event = ListEvent.builder()
                .type(ListEvent.Type.ADDED)
                .listId(listId)
                .itemId(item.getId())
                .itemDisplayName(item.getDisplayName())
                .quantityUnit(item.getQuantity() + " " + item.getUnit())
                .userId(user.getId())
                .userDisplayName(user.getDisplayName() != null ? user.getDisplayName() : user.getEmail() != null ? user.getEmail() : user.getPhone())
                .build();
        messagingTemplate.convertAndSend("/topic/lists/" + listId, event);
        String who = user.getDisplayName() != null ? user.getDisplayName() : user.getEmail() != null ? user.getEmail() : user.getPhone();
        String msg = who + " הוסיף: " + item.getDisplayName() + " " + item.getQuantity() + " " + item.getUnit();
        fcmService.notifyListUpdated(listId, user.getId(), "Listyyy", msg);
    }

    public void publishItemRemoved(UUID listId, UUID itemId, String itemDisplayName, String quantityUnit, User user) {
        ListEvent event = ListEvent.builder()
                .type(ListEvent.Type.REMOVED)
                .listId(listId)
                .itemId(itemId)
                .itemDisplayName(itemDisplayName)
                .quantityUnit(quantityUnit)
                .userId(user.getId())
                .userDisplayName(user.getDisplayName() != null ? user.getDisplayName() : user.getEmail() != null ? user.getEmail() : user.getPhone())
                .build();
        messagingTemplate.convertAndSend("/topic/lists/" + listId, event);
        String who = user.getDisplayName() != null ? user.getDisplayName() : user.getEmail() != null ? user.getEmail() : user.getPhone();
        String msg = who + " הסיר: " + itemDisplayName + " " + quantityUnit;
        fcmService.notifyListUpdated(listId, user.getId(), "Listyyy", msg);
    }

    public void publishItemUpdated(UUID listId, ListItem item, User user) {
        ListEvent event = ListEvent.builder()
                .type(ListEvent.Type.UPDATED)
                .listId(listId)
                .itemId(item.getId())
                .itemDisplayName(item.getDisplayName())
                .quantityUnit(item.getQuantity() + " " + item.getUnit())
                .userId(user.getId())
                .userDisplayName(user.getDisplayName() != null ? user.getDisplayName() : user.getEmail() != null ? user.getEmail() : user.getPhone())
                .build();
        messagingTemplate.convertAndSend("/topic/lists/" + listId, event);
        String who = user.getDisplayName() != null ? user.getDisplayName() : user.getEmail() != null ? user.getEmail() : user.getPhone();
        String msg = who + " עדכן: " + item.getDisplayName() + " " + item.getQuantity() + " " + item.getUnit();
        fcmService.notifyListUpdated(listId, user.getId(), "Listyyy", msg);
    }
}
