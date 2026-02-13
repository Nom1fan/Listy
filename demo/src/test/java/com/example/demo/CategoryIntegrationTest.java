package com.example.demo;

import com.example.demo.auth.User;
import com.example.demo.auth.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.ResultActions;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class CategoryIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private com.example.demo.productbank.CategoryMemberRepository categoryMemberRepository;

    @Test
    void share_all_categories_invites_user_to_all_owned_categories() throws Exception {
        User other = userRepository.save(User.builder()
                .email("other@example.com")
                .passwordHash(passwordEncoder.encode("pass123"))
                .displayName("Other User")
                .locale("he")
                .build());

        // Before share-all: memberCount should be 1
        mvc.perform(get("/api/categories").header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].memberCount").value(1));

        mvc.perform(post("/api/categories/share-all")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "other@example.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.member.userId").value(other.getId().toString()))
                .andExpect(jsonPath("$.categoriesAdded").value(1))
                .andExpect(jsonPath("$.totalCategories").value(1));

        assertThat(categoryMemberRepository.existsByCategoryIdAndUserId(categoryId, other.getId())).isTrue();

        // After share-all: memberCount should be 2
        mvc.perform(get("/api/categories").header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].memberCount").value(2));
    }

    @Test
    void share_all_categories_requires_auth() throws Exception {
        mvc.perform(post("/api/categories/share-all")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "other@example.com"))))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void category_invite_and_members() throws Exception {
        User other = userRepository.save(User.builder()
                .email("other@example.com")
                .passwordHash(passwordEncoder.encode("pass123"))
                .displayName("Other User")
                .locale("he")
                .build());

        // Before invite: memberCount should be 1 (owner only)
        mvc.perform(get("/api/categories/" + categoryId).header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.memberCount").value(1));

        mvc.perform(get("/api/categories/" + categoryId + "/members").header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].role").value("owner"));

        // Invite another user
        mvc.perform(post("/api/categories/" + categoryId + "/members")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "other@example.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(other.getId().toString()))
                .andExpect(jsonPath("$.role").value("editor"));

        mvc.perform(get("/api/categories/" + categoryId + "/members").header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        // After invite: memberCount should be 2 on category DTO
        mvc.perform(get("/api/categories/" + categoryId).header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.memberCount").value(2));

        // Also verify memberCount in the category list endpoint
        mvc.perform(get("/api/categories").header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id=='" + categoryId + "')].memberCount").value(2));

        assertThat(categoryMemberRepository.existsByCategoryIdAndUserId(categoryId, other.getId())).isTrue();
    }

    @Test
    void list_categories_requires_auth() throws Exception {
        mvc.perform(get("/api/categories")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/categories").header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].nameHe").value("מכולת"))
                .andExpect(jsonPath("$[0].memberCount").value(1));
    }

    @Test
    void get_category_by_id_requires_auth() throws Exception {
        mvc.perform(get("/api/categories/" + categoryId)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/categories/" + categoryId).header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(categoryId.toString()))
                .andExpect(jsonPath("$.nameHe").value("מכולת"))
                .andExpect(jsonPath("$.iconId").value("groceries"))
                .andExpect(jsonPath("$.memberCount").value(1));
    }

    @Test
    void create_category_requires_auth() throws Exception {
        mvc.perform(post("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("nameHe", "חדש"))))
                .andExpect(status().is4xxClientError()); // 401 or 403 when unauthenticated
    }

    @Test
    void create_update_delete_category() throws Exception {
        ResultActions create = mvc.perform(post("/api/categories")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nameHe", "קטגוריה חדשה",
                                "iconId", "leaf",
                                "sortOrder", 10))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nameHe").value("קטגוריה חדשה"))
                .andExpect(jsonPath("$.iconId").value("leaf"))
                .andExpect(jsonPath("$.memberCount").value(1));

        String id = objectMapper.readTree(create.andReturn().getResponse().getContentAsString()).get("id").asText();

        mvc.perform(patch("/api/categories/" + id)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("nameHe", "שם מעודכן", "iconId", "fruits"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nameHe").value("שם מעודכן"))
                .andExpect(jsonPath("$.iconId").value("fruits"))
                .andExpect(jsonPath("$.memberCount").value(1));

        mvc.perform(delete("/api/categories/" + id).header("Authorization", getBearerToken()))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/categories/" + id).header("Authorization", getBearerToken()))
                .andExpect(status().isNotFound());
    }
}
