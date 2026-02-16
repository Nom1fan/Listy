package com.listyyy.backend.list;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class UpdateListItemRequest {

    private BigDecimal quantity;
    private String unit;
    private String note;
    private Boolean crossedOff;
    private String customNameHe;
    private String itemImageUrl;
    private String iconId;
    /** Move item to a different category; null = no change */
    private UUID categoryId;
    /** Optimistic-locking version from the client; null skips the check. */
    private Long version;
}