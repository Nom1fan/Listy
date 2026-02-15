package com.listyyy.backend;

import com.listyyy.backend.auth.User;
import com.listyyy.backend.auth.UserRepository;
import com.listyyy.backend.list.GroceryList;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
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

    @Test
    void cannot_create_duplicate_category_in_same_workspace() throws Exception {
        // "מכולת" already exists in the default workspace (created in baseSetUp)
        mvc.perform(post("/api/categories")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nameHe", "מכולת",
                                "workspaceId", workspaceId.toString()))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("כבר קיימת")));
    }

    @Test
    void cannot_rename_category_to_existing_name_in_same_workspace() throws Exception {
        // Create a second category
        var create = mvc.perform(post("/api/categories")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nameHe", "ירקות",
                                "workspaceId", workspaceId.toString()))))
                .andExpect(status().isOk());
        String newCatId = objectMapper.readTree(create.andReturn().getResponse().getContentAsString()).get("id").asText();

        // Try to rename "ירקות" to "מכולת" (already exists)
        mvc.perform(patch("/api/categories/" + newCatId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("nameHe", "מכולת"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("כבר קיימת")));
    }

    @Test
    void can_rename_category_to_its_own_name() throws Exception {
        mvc.perform(patch("/api/categories/" + categoryId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("nameHe", "מכולת"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nameHe").value("מכולת"));
    }

    @Test
    void delete_category_with_products_referenced_by_list_items() throws Exception {
        // The default category already has a product ("אורז")
        // Create a list and add the product to it
        GroceryList list = listRepository.save(GroceryList.builder()
                .workspace(workspaceRepository.findById(workspaceId).orElseThrow())
                .name("רשימת בדיקה")
                .build());

        mvc.perform(post("/api/lists/" + list.getId() + "/items")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("productId", productId.toString()))))
                .andExpect(status().isOk());

        // Delete the category — should cascade without constraint violation
        mvc.perform(delete("/api/categories/" + categoryId)
                        .header("Authorization", getBearerToken()))
                .andExpect(status().isNoContent());

        // Verify the category is gone
        mvc.perform(get("/api/categories/" + categoryId)
                        .header("Authorization", getBearerToken()))
                .andExpect(status().isNotFound());

        // Verify the product is gone
        mvc.perform(get("/api/products/" + productId)
                        .header("Authorization", getBearerToken()))
                .andExpect(status().isNotFound());

        // Verify the list item was also removed
        mvc.perform(get("/api/lists/" + list.getId() + "/items")
                        .header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }
}
