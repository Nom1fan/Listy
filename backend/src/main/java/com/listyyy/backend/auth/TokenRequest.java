package com.listyyy.backend.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TokenRequest {

    @NotBlank
    private String email;

    @NotBlank
    private String password;
}
