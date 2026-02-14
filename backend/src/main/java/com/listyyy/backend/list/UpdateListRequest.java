package com.listyyy.backend.list;

import lombok.Data;

@Data
public class UpdateListRequest {

    private String name;
    private String iconId;
    private String imageUrl;
}