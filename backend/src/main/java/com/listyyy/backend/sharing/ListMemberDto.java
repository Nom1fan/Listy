package com.listyyy.backend.sharing;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ListMemberDto {

    private UUID userId;
    private String displayName;
    private String profileImageUrl;
    private String email;
    private String phone;
    private String role;
    /** True when this row represents a pending invitation (not yet accepted). */
    @Builder.Default
    private Boolean pending = false;
    private Instant invitedAt;
}
