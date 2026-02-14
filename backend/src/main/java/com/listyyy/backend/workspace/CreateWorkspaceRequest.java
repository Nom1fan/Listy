package com.listyyy.backend.workspace;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateWorkspaceRequest {
    @NotBlank
    private String name;
    private String iconId;
}
