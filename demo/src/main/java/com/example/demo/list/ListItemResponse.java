package com.example.demo.list;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ListItemResponse {

    private UUID id;
    private UUID listId;
    private UUID productId;
    private String customNameHe;
    private String displayName;
    private UUID categoryId;
    private String categoryNameHe;
    private String categoryIconId;
    /** Product icon override when set; use this for display, else categoryIconId */
    private String iconId;
    private BigDecimal quantity;
    private String unit;
    private String note;
    private boolean crossedOff;
    private String itemImageUrl;
    private String productImageUrl;
    private int sortOrder;
    private Instant createdAt;
    private Instant updatedAt;
}
