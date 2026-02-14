package com.listyyy.backend.notification;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FcmRegisterRequest {

    @NotBlank
    private String token;

    private String deviceId;
}
