package com.listyyy.backend.productbank;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class ReorderCategoriesRequest {

    private List<UUID> categoryIds;
}
