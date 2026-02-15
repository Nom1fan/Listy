package com.listyyy.backend.list;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class ReorderListItemsRequest {

    private List<UUID> itemIds;
}
