package com.listyyy.backend;

import com.listyyy.backend.auth.User;
import com.listyyy.backend.auth.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.ResultActions;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class WorkspaceIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void list_workspaces_returns_default_workspace() throws Exception {
        mvc.perform(get("/api/workspaces").header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("הרשימות שלי"))
                .andExpect(jsonPath("$[0].role").value("owner"))
                .andExpect(jsonPath("$[0].memberCount").value(1));
    }

    @Test
    void create_workspace() throws Exception {
        mvc.perform(post("/api/workspaces")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "סרטים"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("סרטים"))
                .andExpect(jsonPath("$.role").value("owner"))
                .andExpect(jsonPath("$.memberCount").value(1));

        mvc.perform(get("/api/workspaces").header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void update_workspace() throws Exception {
        mvc.perform(patch("/api/workspaces/" + workspaceId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "קניות"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("קניות"));
    }

    @Test
    void delete_workspace_only_if_not_last() throws Exception {
        // Can't delete the only workspace
        mvc.perform(delete("/api/workspaces/" + workspaceId)
                        .header("Authorization", getBearerToken()))
                .andExpect(status().is4xxClientError());

        // Create a second workspace
        ResultActions create = mvc.perform(post("/api/workspaces")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "למחיקה"))))
                .andExpect(status().isOk());
        String newId = objectMapper.readTree(create.andReturn().getResponse().getContentAsString()).get("id").asText();

        // Now we can delete the new one
        mvc.perform(delete("/api/workspaces/" + newId)
                        .header("Authorization", getBearerToken()))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/workspaces").header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void invite_member_to_workspace() throws Exception {
        User other = userRepository.save(User.builder()
                .email("other@example.com")
                .passwordHash(passwordEncoder.encode("pass123"))
                .displayName("Other User")
                .locale("he")
                .build());

        // Invite
        mvc.perform(post("/api/workspaces/" + workspaceId + "/members")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "other@example.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(other.getId().toString()))
                .andExpect(jsonPath("$.role").value("editor"));

        // Verify member count
        mvc.perform(get("/api/workspaces/" + workspaceId).header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.memberCount").value(2));

        // Other user can now see the workspace
        String otherToken = login("other@example.com", "pass123");
        mvc.perform(get("/api/workspaces").header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("הרשימות שלי"));

        // Other user can see categories in the workspace
        mvc.perform(get("/api/categories").header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nameHe").value("מכולת"));
    }

    @Test
    void remove_member_from_workspace() throws Exception {
        User other = userRepository.save(User.builder()
                .email("other@example.com")
                .passwordHash(passwordEncoder.encode("pass123"))
                .displayName("Other User")
                .locale("he")
                .build());

        // Invite and then remove
        mvc.perform(post("/api/workspaces/" + workspaceId + "/members")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "other@example.com"))))
                .andExpect(status().isOk());

        mvc.perform(delete("/api/workspaces/" + workspaceId + "/members/" + other.getId())
                        .header("Authorization", getBearerToken()))
                .andExpect(status().isNoContent());

        // Other can no longer see the workspace
        String otherToken = login("other@example.com", "pass123");
        mvc.perform(get("/api/workspaces").header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void member_can_leave_workspace() throws Exception {
        User other = userRepository.save(User.builder()
                .email("other@example.com")
                .passwordHash(passwordEncoder.encode("pass123"))
                .displayName("Other User")
                .locale("he")
                .build());

        mvc.perform(post("/api/workspaces/" + workspaceId + "/members")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "other@example.com"))))
                .andExpect(status().isOk());

        // Member leaves on their own
        String otherToken = login("other@example.com", "pass123");
        mvc.perform(delete("/api/workspaces/" + workspaceId + "/members/" + other.getId())
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNoContent());
    }

    @Test
    void cannot_remove_workspace_owner() throws Exception {
        mvc.perform(delete("/api/workspaces/" + workspaceId + "/members/" + testUser.getId())
                        .header("Authorization", getBearerToken()))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void workspaces_require_auth() throws Exception {
        mvc.perform(get("/api/workspaces")).andExpect(status().is4xxClientError());
        mvc.perform(post("/api/workspaces")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("name", "x"))))
                .andExpect(status().is4xxClientError());
    }
}
