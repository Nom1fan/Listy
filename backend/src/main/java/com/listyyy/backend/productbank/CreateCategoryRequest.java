package com.listyyy.backend.productbank;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateCategoryRequest {

    @NotBlank
    private String nameHe;
    private String iconId;
    private String imageUrl;
    private Integer sortOrder;

    @NotNull
    private UUID workspaceId;
}
