package com.listyyy.backend.productbank;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateCategoryRequest {

    @NotBlank
    private String nameHe;
    private String iconId;
    private String imageUrl;
    private Integer sortOrder;
}
