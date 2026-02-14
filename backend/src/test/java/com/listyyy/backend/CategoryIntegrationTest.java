package com.listyyy.backend;

import com.listyyy.backend.auth.User;
import com.listyyy.backend.auth.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class CategoryIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void list_categories_requires_auth() throws Exception {
        mvc.perform(get("/api/categories")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/categories").header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].nameHe").value("מכולת"));
    }

    @Test
    void list_categories_filtered_by_workspace() throws Exception {
        mvc.perform(get("/api/categories")
                        .param("workspaceId", workspaceId.toString())
                        .header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].nameHe").value("מכולת"))
                .andExpect(jsonPath("$[0].workspaceId").value(workspaceId.toString()));
    }

    @Test
    void get_category_by_id_requires_auth() throws Exception {
        mvc.perform(get("/api/categories/" + categoryId)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/categories/" + categoryId).header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(categoryId.toString()))
                .andExpect(jsonPath("$.nameHe").value("מכולת"))
                .andExpect(jsonPath("$.iconId").value("groceries"))
                .andExpect(jsonPath("$.workspaceId").value(workspaceId.toString()));
    }

    @Test
    void create_category_requires_auth() throws Exception {
        mvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("nameHe", "חדש", "workspaceId", workspaceId.toString()))))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void create_update_delete_category() throws Exception {
        var create = mvc.perform(post("/api/categories")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nameHe", "קטגוריה חדשה",
                                "iconId", "leaf",
                                "sortOrder", 10,
                                "workspaceId", workspaceId.toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nameHe").value("קטגוריה חדשה"))
                .andExpect(jsonPath("$.iconId").value("leaf"))
                .andExpect(jsonPath("$.workspaceId").value(workspaceId.toString()));

        String id = objectMapper.readTree(create.andReturn().getResponse().getContentAsString()).get("id").asText();

        mvc.perform(patch("/api/categories/" + id)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("nameHe", "שם מעודכן", "iconId", "fruits"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nameHe").value("שם מעודכן"))
                .andExpect(jsonPath("$.iconId").value("fruits"));

        mvc.perform(delete("/api/categories/" + id).header("Authorization", getBearerToken()))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/categories/" + id).header("Authorization", getBearerToken()))
                .andExpect(status().isNotFound());
    }

    @Test
    void create_category_requires_workspace_id() throws Exception {
        mvc.perform(post("/api/categories")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("nameHe", "ללא מרחב"))))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void non_workspace_member_cannot_access_category() throws Exception {
        User other = userRepository.save(User.builder()
                .email("other@example.com")
                .passwordHash(passwordEncoder.encode("pass123"))
                .displayName("Other User")
                .locale("he")
                .build());
        String otherToken = login("other@example.com", "pass123");

        // Other user should not see this category
        mvc.perform(get("/api/categories/" + categoryId).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().is4xxClientError());
    }
}
