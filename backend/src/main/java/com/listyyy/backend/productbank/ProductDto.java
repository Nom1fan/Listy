package com.listyyy.backend.productbank;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class ProductDto {

    private UUID id;
    private UUID categoryId;
    private String categoryNameHe;
    private String categoryIconId;
    /** Product-level icon override; null means use category icon */
    private String iconId;
    private String nameHe;
    private String defaultUnit;
    private String imageUrl;
    /** Permanent note on this product (set at category level). */
    private String note;
    /** Number of times this product has been added to any list (for sorting by frequency). */
    private long addCount;
}
