package com.example.demo.productbank;

import lombok.Data;

@Data
public class UpdateCategoryRequest {

    private String nameHe;
    private String iconId;
    private String imageUrl;
    private Integer sortOrder;
}
