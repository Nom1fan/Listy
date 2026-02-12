package com.example.demo.productbank;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class CategoryDto {

    private UUID id;
    private String nameHe;
    private String iconId;
    private String imageUrl;
    private int sortOrder;
    /** Total number of list-item adds for products in this category (for sorting by frequency). */
    private long addCount;
}
