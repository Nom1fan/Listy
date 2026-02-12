package com.example.demo.websocket;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class ListEvent {

    public enum Type { ADDED, REMOVED, UPDATED }

    private Type type;
    private UUID listId;
    private UUID itemId;
    private String itemDisplayName;
    private String quantityUnit;
    private UUID userId;
    private String userDisplayName;
}
