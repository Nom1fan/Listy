package com.example.demo.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EmailRequestOtpRequest {

    @NotBlank
    @Email(message = "כתובת אימייל לא תקינה")
    private String email;
}
