package com.example.demo.list;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class ReorderListsRequest {

    private List<UUID> listIds;
}
