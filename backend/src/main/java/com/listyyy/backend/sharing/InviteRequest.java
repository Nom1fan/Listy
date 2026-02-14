package com.listyyy.backend.sharing;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class InviteRequest {

    @Size(max = 255, message = "אימייל ארוך מדי")
    private String email;

    @Size(max = 30, message = "מספר טלפון ארוך מדי")
    private String phone;
}
