package com.example.demo.productbank;

import lombok.Data;

@Data
public class UpdateProductRequest {

    private String imageUrl;
    /** Product-level icon override; null means use category icon */
    private String iconId;
}
