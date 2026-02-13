package com.example.demo.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class EmailVerifyRequest {

    @NotBlank
    @Email(message = "כתובת אימייל לא תקינה")
    private String email;

    @NotBlank
    @Pattern(regexp = "^\\d{4,6}$", message = "הקוד חייב להיות 4-6 ספרות")
    private String code;

    private String displayName;
}
