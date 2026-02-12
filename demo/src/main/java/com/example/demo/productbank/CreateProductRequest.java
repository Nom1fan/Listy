package com.example.demo.productbank;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateProductRequest {

    @NotNull
    private UUID categoryId;

    @NotBlank
    private String nameHe;

    private String defaultUnit;

    private String iconId;
    private String imageUrl;
}
