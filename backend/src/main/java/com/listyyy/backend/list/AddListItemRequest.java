package com.listyyy.backend.list;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class AddListItemRequest {

    private UUID productId;
    private String customNameHe;
    private BigDecimal quantity;
    private String unit;
    private String note;
    private Integer sortOrder;
    private String itemImageUrl;
    private String iconId;
}
