package com.example.demo.list;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ListResponse {

    private UUID id;
    private String name;
    private UUID ownerId;
    private String iconId;
    private String imageUrl;
    private Instant createdAt;
    private Instant updatedAt;
}
