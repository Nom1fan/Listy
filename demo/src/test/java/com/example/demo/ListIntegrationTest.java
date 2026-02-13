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
    void delete_list_with_items_and_members() throws Exception {
        // Create another user to invite
        User other = userRepository.save(User.builder()
                .email("member@example.com")
                .passwordHash(passwordEncoder.encode("pass123"))
                .displayName("Member User")
                .locale("he")
                .build());

        // Create a list
        String listId = createList("List to delete");

        // Add a product item
        mvc.perform(post("/api/lists/" + listId + "/items")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", productId.toString(),
                                "quantity", 2))))
                .andExpect(status().isOk());

        // Add a custom item
        mvc.perform(post("/api/lists/" + listId + "/items")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "customNameHe", "פריט חופשי",
                                "quantity", 1))))
                .andExpect(status().isOk());

        // Invite a member
        mvc.perform(post("/api/lists/" + listId + "/members")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "member@example.com"))))
                .andExpect(status().isOk());

        // Verify items and members exist
        mvc.perform(get("/api/lists/" + listId + "/items").header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        // Delete the list
        mvc.perform(delete("/api/lists/" + listId).header("Authorization", getBearerToken()))
                .andExpect(status().isNoContent());

        // Verify list is gone
        mvc.perform(get("/api/lists").header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void create_list_returns_sort_order() throws Exception {
        mvc.perform(post("/api/lists")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "First"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sortOrder").value(0));
    }

    @Test
    void reorder_lists() throws Exception {
        // Create 3 lists
        String id1 = createList("List A");
        String id2 = createList("List B");
        String id3 = createList("List C");

        // Verify initial order
        mvc.perform(get("/api/lists").header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("List A"))
                .andExpect(jsonPath("$[1].name").value("List B"))
                .andExpect(jsonPath("$[2].name").value("List C"));

        // Reorder: C, A, B
        mvc.perform(put("/api/lists/reorder")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "listIds", java.util.List.of(id3, id1, id2)))))
                .andExpect(status().isNoContent());

        // Verify new order
        mvc.perform(get("/api/lists").header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("List C"))
                .andExpect(jsonPath("$[0].sortOrder").value(0))
                .andExpect(jsonPath("$[1].name").value("List A"))
                .andExpect(jsonPath("$[1].sortOrder").value(1))
                .andExpect(jsonPath("$[2].name").value("List B"))
                .andExpect(jsonPath("$[2].sortOrder").value(2));
    }

    @Test
    void reorder_requires_auth() throws Exception {
        mvc.perform(put("/api/lists/reorder")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "listIds", java.util.List.of(UUID.randomUUID())))))
                .andExpect(status().is4xxClientError());
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
