package com.example.demo.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class PhoneVerifyRequest {

    @NotBlank
    @Pattern(regexp = "^\\+[1-9]\\d{1,14}$", message = "מספר טלפון לא תקין")
    private String phone;

    @NotBlank
    @Pattern(regexp = "^\\d{4,6}$", message = "הקוד חייב להיות 4-6 ספרות")
    private String code;

    private String displayName;
}
