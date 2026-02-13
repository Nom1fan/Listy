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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ListIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private com.example.demo.productbank.CategoryMemberRepository categoryMemberRepository;

    @Test
    void invite_to_list_auto_shares_categories_used_by_list_items() throws Exception {
        User other = userRepository.save(User.builder()
                .email("other@example.com")
                .passwordHash(passwordEncoder.encode("pass123"))
                .displayName("Other User")
                .locale("he")
                .build());

        String listId = createList("List to share");
        mvc.perform(post("/api/lists/" + listId + "/items")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", productId.toString(),
                                "quantity", 1))))
                .andExpect(status().isOk());

        mvc.perform(post("/api/lists/" + listId + "/members")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "other@example.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(other.getId().toString()))
                .andExpect(jsonPath("$.role").value("editor"));

        assertThat(categoryMemberRepository.existsByCategoryIdAndUserId(categoryId, other.getId())).isTrue();
    }

    @Test
    void create_list_and_get_lists() throws Exception {
        ResultActions create = mvc.perform(post("/api/lists")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "My List"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.name").value("My List"));

        String listId = objectMapper.readTree(create.andReturn().getResponse().getContentAsString()).get("id").asText();

        mvc.perform(get("/api/lists").header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(listId))
                .andExpect(jsonPath("$[0].name").value("My List"));

        mvc.perform(get("/api/lists/" + listId).header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("My List"));
    }

    @Test
    void update_and_delete_list() throws Exception {
        String listId = createList("To Update");

        mvc.perform(put("/api/lists/" + listId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "Updated Name"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Name"));

        mvc.perform(delete("/api/lists/" + listId).header("Authorization", getBearerToken()))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/lists").header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void add_item_with_product_and_update_and_remove() throws Exception {
        String listId = createList("List with items");

        ResultActions add = mvc.perform(post("/api/lists/" + listId + "/items")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", productId.toString(),
                                "quantity", 2,
                                "unit", "קילו"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("אורז"))
                .andExpect(jsonPath("$.quantity").value(2));

        String itemId = objectMapper.readTree(add.andReturn().getResponse().getContentAsString()).get("id").asText();

        mvc.perform(get("/api/lists/" + listId + "/items").header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(itemId));

        mvc.perform(patch("/api/lists/" + listId + "/items/" + itemId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("crossedOff", true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.crossedOff").value(true));

        mvc.perform(delete("/api/lists/" + listId + "/items/" + itemId).header("Authorization", getBearerToken()))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/lists/" + listId + "/items").header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void add_custom_item() throws Exception {
        String listId = createList("List");

        mvc.perform(post("/api/lists/" + listId + "/items")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "customNameHe", "משהו מיוחד",
                                "quantity", 1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("משהו מיוחד"));
    }

    @Test
    void lists_require_auth() throws Exception {
        mvc.perform(get("/api/lists")).andExpect(status().is4xxClientError());
        mvc.perform(post("/api/lists")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("name", "x"))))
                .andExpect(status().is4xxClientError());
    }

    private String createList(String name) throws Exception {
        ResultActions r = mvc.perform(post("/api/lists")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", name))))
                .andExpect(status().isOk());
        return objectMapper.readTree(r.andReturn().getResponse().getContentAsString()).get("id").asText();
    }
}
