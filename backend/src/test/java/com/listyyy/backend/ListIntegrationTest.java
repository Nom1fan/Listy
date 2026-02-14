package com.listyyy.backend;

import com.listyyy.backend.auth.User;
import com.listyyy.backend.auth.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.ResultActions;

import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ListIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void create_list_and_get_lists() throws Exception {
        ResultActions create = mvc.perform(post("/api/lists")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "My List",
                                "workspaceId", workspaceId.toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.name").value("My List"))
                .andExpect(jsonPath("$.workspaceId").value(workspaceId.toString()));

        String listId = objectMapper.readTree(create.andReturn().getResponse().getContentAsString()).get("id").asText();

        mvc.perform(get("/api/lists").header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(listId))
                .andExpect(jsonPath("$[0].name").value("My List"))
                .andExpect(jsonPath("$[0].workspaceId").value(workspaceId.toString()));

        mvc.perform(get("/api/lists/" + listId).header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("My List"));
    }

    @Test
    void list_filtered_by_workspace() throws Exception {
        String listId = createList("Workspace List");
        mvc.perform(get("/api/lists")
                        .param("workspaceId", workspaceId.toString())
                        .header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Workspace List"));
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
    void workspace_member_can_access_shared_list() throws Exception {
        User other = userRepository.save(User.builder()
                .email("other@example.com")
                .passwordHash(passwordEncoder.encode("pass123"))
                .displayName("Other User")
                .locale("he")
                .build());
        String otherToken = login("other@example.com", "pass123");

        String listId = createList("Shared via workspace");

        // Other user cannot access yet
        mvc.perform(get("/api/lists/" + listId).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().is4xxClientError());

        // Invite other user to workspace
        mvc.perform(post("/api/workspaces/" + workspaceId + "/members")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "other@example.com"))))
                .andExpect(status().isOk());

        // Now other user can access the list
        mvc.perform(get("/api/lists/" + listId).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Shared via workspace"));
    }

    @Test
    void create_list_requires_workspace_id() throws Exception {
        mvc.perform(post("/api/lists")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "No workspace"))))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void reorder_lists() throws Exception {
        String id1 = createList("List A");
        String id2 = createList("List B");
        String id3 = createList("List C");

        mvc.perform(put("/api/lists/reorder")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "listIds", java.util.List.of(id3, id1, id2)))))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/lists").header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("List C"))
                .andExpect(jsonPath("$[1].name").value("List A"))
                .andExpect(jsonPath("$[2].name").value("List B"));
    }

    @Test
    void lists_require_auth() throws Exception {
        mvc.perform(get("/api/lists")).andExpect(status().is4xxClientError());
        mvc.perform(post("/api/lists")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("name", "x", "workspaceId", workspaceId.toString()))))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void cannot_add_same_product_twice_to_list() throws Exception {
        String listId = createList("Dup product test");

        // First add succeeds
        mvc.perform(post("/api/lists/" + listId + "/items")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", productId.toString(),
                                "quantity", 1))))
                .andExpect(status().isOk());

        // Second add of the same product should fail
        mvc.perform(post("/api/lists/" + listId + "/items")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", productId.toString(),
                                "quantity", 3))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("כבר קיים")));
    }

    @Test
    void cannot_add_duplicate_custom_item_name_to_list() throws Exception {
        String listId = createList("Dup custom test");

        // First custom item succeeds
        mvc.perform(post("/api/lists/" + listId + "/items")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "customNameHe", "פריט מותאם",
                                "quantity", 1))))
                .andExpect(status().isOk());

        // Second custom item with the same name should fail
        mvc.perform(post("/api/lists/" + listId + "/items")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "customNameHe", "פריט מותאם",
                                "quantity", 2))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("כבר קיים")));
    }

    @Test
    void can_add_same_product_to_different_lists() throws Exception {
        String listA = createList("List A");
        String listB = createList("List B");

        mvc.perform(post("/api/lists/" + listA + "/items")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", productId.toString(),
                                "quantity", 1))))
                .andExpect(status().isOk());

        mvc.perform(post("/api/lists/" + listB + "/items")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", productId.toString(),
                                "quantity", 1))))
                .andExpect(status().isOk());
    }

    @Test
    void can_add_same_custom_name_to_different_lists() throws Exception {
        String listA = createList("List A");
        String listB = createList("List B");

        mvc.perform(post("/api/lists/" + listA + "/items")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "customNameHe", "פריט מותאם",
                                "quantity", 1))))
                .andExpect(status().isOk());

        mvc.perform(post("/api/lists/" + listB + "/items")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "customNameHe", "פריט מותאם",
                                "quantity", 1))))
                .andExpect(status().isOk());
    }

    private String createList(String name) throws Exception {
        ResultActions r = mvc.perform(post("/api/lists")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", name,
                                "workspaceId", workspaceId.toString()))))
                .andExpect(status().isOk());
        return objectMapper.readTree(r.andReturn().getResponse().getContentAsString()).get("id").asText();
    }
}
