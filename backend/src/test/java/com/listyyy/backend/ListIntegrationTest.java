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
import static org.hamcrest.Matchers.hasSize;
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

    @Test
    void cannot_create_duplicate_list_name_in_same_workspace() throws Exception {
        createList("רשימת קניות");

        // Second list with the same name should fail
        mvc.perform(post("/api/lists")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "רשימת קניות",
                                "workspaceId", workspaceId.toString()))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("כבר קיימת")));
    }

    @Test
    void cannot_rename_list_to_existing_name_in_same_workspace() throws Exception {
        createList("רשימה א");
        String listBId = createList("רשימה ב");

        // Rename "רשימה ב" to "רשימה א" should fail
        mvc.perform(put("/api/lists/" + listBId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "רשימה א"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("כבר קיימת")));
    }

    @Test
    void can_rename_list_to_its_own_name() throws Exception {
        String listId = createList("שם קיים");

        mvc.perform(put("/api/lists/" + listId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "שם קיים"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("שם קיים"));
    }

    @Test
    void add_custom_item_with_category_creates_product() throws Exception {
        String listId = createList("רשימה עם מוצר חדש");
        String catId = categoryId.toString();

        // Add a custom item with a categoryId — should auto-create a product
        var node = objectMapper.createObjectNode();
        node.put("customNameHe", "שוקולד");
        node.put("categoryId", catId);
        node.put("unit", "יחידה");

        mvc.perform(post("/api/lists/" + listId + "/items")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(node.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("שוקולד"));

        // Verify the product now appears in the product bank
        mvc.perform(get("/api/products")
                        .header("Authorization", getBearerToken())
                        .param("categoryId", catId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.nameHe == 'שוקולד')]").exists());
    }

    @Test
    void move_product_based_item_to_different_category() throws Exception {
        String listId = createList("רשימה עם העברה");

        // Add product-based item
        ResultActions add = mvc.perform(post("/api/lists/" + listId + "/items")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", productId.toString()))))
                .andExpect(status().isOk());
        String itemId = objectMapper.readTree(add.andReturn().getResponse().getContentAsString()).get("id").asText();

        // Create a second category
        var cat2 = categoryRepository.save(
                com.listyyy.backend.productbank.Category.builder()
                        .workspace(workspaceRepository.findById(workspaceId).orElseThrow())
                        .nameHe("ירקות")
                        .sortOrder(1)
                        .build());

        // Move item to the new category (this moves the underlying product)
        mvc.perform(patch("/api/lists/" + listId + "/items/" + itemId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("categoryId", cat2.getId().toString()))))
                .andExpect(status().isOk());

        // Verify the underlying product is now in the new category
        mvc.perform(get("/api/products/" + productId)
                        .header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoryId").value(cat2.getId().toString()));
    }

    @Test
    void move_custom_item_to_category_creates_product() throws Exception {
        String listId = createList("רשימה עם מותאם");

        // Add a custom item (no product, no category)
        ResultActions add = mvc.perform(post("/api/lists/" + listId + "/items")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "customNameHe", "פריט מותאם לנייד",
                                "quantity", 1,
                                "unit", "יחידה"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("פריט מותאם לנייד"));
        String itemId = objectMapper.readTree(add.andReturn().getResponse().getContentAsString()).get("id").asText();

        // Move the custom item to a category (this should create a product)
        mvc.perform(patch("/api/lists/" + listId + "/items/" + itemId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("categoryId", categoryId.toString()))))
                .andExpect(status().isOk());

        // Verify a product was created in the category
        mvc.perform(get("/api/products")
                        .header("Authorization", getBearerToken())
                        .param("categoryId", categoryId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.nameHe == 'פריט מותאם לנייד')]").exists());
    }

    @Test
    void delete_list_also_removes_items() throws Exception {
        String listId = createList("רשימה למחיקה");

        // Add an item to the list
        mvc.perform(post("/api/lists/" + listId + "/items")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("productId", productId.toString()))))
                .andExpect(status().isOk());

        // Delete the list
        mvc.perform(delete("/api/lists/" + listId)
                        .header("Authorization", getBearerToken()))
                .andExpect(status().isNoContent());

        // Verify list is gone
        mvc.perform(get("/api/lists/" + listId)
                        .header("Authorization", getBearerToken()))
                .andExpect(status().isNotFound());
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
