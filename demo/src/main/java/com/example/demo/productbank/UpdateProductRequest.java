package com.example.demo.productbank;

import lombok.Data;

@Data
public class UpdateProductRequest {

    /** Product name; null = no change */
    private String nameHe;
    /** Default unit; null = no change */
    private String defaultUnit;
    private String imageUrl;
    /** Product-level icon override; null means use category icon */
    private String iconId;
    /** Permanent note on this product; null = no change, empty string = clear */
    private String note;
}
