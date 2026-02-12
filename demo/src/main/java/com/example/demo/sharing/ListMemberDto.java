package com.example.demo.sharing;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class ListMemberDto {

    private UUID userId;
    private String displayName;
    private String email;
    private String phone;
    private String role;
}
