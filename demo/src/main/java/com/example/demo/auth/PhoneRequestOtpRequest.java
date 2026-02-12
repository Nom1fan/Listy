package com.example.demo.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class PhoneRequestOtpRequest {

    @NotBlank
    @Pattern(regexp = "^\\+[1-9]\\d{1,14}$", message = "Phone must be E.164 format")
    private String phone;
}
