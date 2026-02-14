package com.listyyy.backend.auth;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(max = 255)
    private String displayName;
}
