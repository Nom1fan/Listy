package com.example.demo.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class PhoneVerifyRequest {

    @NotBlank
    @Pattern(regexp = "^\\+[1-9]\\d{1,14}$", message = "Phone must be E.164 format")
    private String phone;

    @NotBlank
    @Pattern(regexp = "^\\d{4,6}$", message = "Code must be 4-6 digits")
    private String code;

    private String displayName;
}
