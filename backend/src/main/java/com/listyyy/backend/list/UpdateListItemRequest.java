package com.listyyy.backend.list;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateListItemRequest {

    private BigDecimal quantity;
    private String unit;
    private String note;
    private Boolean crossedOff;
    private String customNameHe;
    private String itemImageUrl;
    private String iconId;
}