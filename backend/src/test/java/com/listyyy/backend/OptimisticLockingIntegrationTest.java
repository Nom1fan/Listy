package com.listyyy.backend;

import com.listyyy.backend.auth.User;
import com.listyyy.backend.list.GroceryList;
import com.listyyy.backend.list.ListItem;
import com.listyyy.backend.productbank.Category;
import com.listyyy.backend.productbank.Product;
import com.listyyy.backend.workspace.Workspace;
import com.listyyy.backend.workspace.WorkspaceMember;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.ResultActions;

import java.math.BigDecimal;
import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests for optimistic locking (version-based concurrency control) across all shared entities.
 */
class OptimisticLockingIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ── Helper methods ─────────────────────────────────────────────────

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

    private long getVersionFromResponse(ResultActions result) throws Exception {
        String body = result.andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("version").asLong();
    }

    private String getIdFromResponse(ResultActions result) throws Exception {
        String body = result.andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("id").asText();
    }

    // ── Version returned in responses ───────────────────────────────────

    @Test
    void workspace_response_includes_version() throws Exception {
        mvc.perform(get("/api/workspaces").header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].version").value(notNullValue()));

        mvc.perform(get("/api/workspaces/" + workspaceId).header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(notNullValue()));
    }

    @Test
    void category_response_includes_version() throws Exception {
        mvc.perform(get("/api/categories").header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].version").value(notNullValue()));

        mvc.perform(get("/api/categories/" + categoryId).header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(notNullValue()));
    }

    @Test
    void product_response_includes_version() throws Exception {
        mvc.perform(get("/api/products").header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].version").value(notNullValue()));

        mvc.perform(get("/api/products/" + productId).header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(notNullValue()));
    }

    @Test
    void list_response_includes_version() throws Exception {
        createList("Version list");
        mvc.perform(get("/api/lists").header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].version").value(notNullValue()));
    }

    @Test
    void list_item_response_includes_version() throws Exception {
        String listId = createList("Item version list");
        mvc.perform(post("/api/lists/" + listId + "/items")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", productId.toString(), "quantity", 1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(notNullValue()));
    }

    // ── Workspace optimistic locking ────────────────────────────────────

    @Test
    void update_workspace_with_correct_version_succeeds() throws Exception {
        ResultActions get = mvc.perform(get("/api/workspaces/" + workspaceId)
                .header("Authorization", getBearerToken()))
                .andExpect(status().isOk());
        long version = getVersionFromResponse(get);

        mvc.perform(patch("/api/workspaces/" + workspaceId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "שם חדש", "version", version))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("שם חדש"))
                .andExpect(jsonPath("$.version").value(version + 1));
    }

    @Test
    void update_workspace_with_stale_version_returns_409() throws Exception {
        ResultActions get = mvc.perform(get("/api/workspaces/" + workspaceId)
                .header("Authorization", getBearerToken()))
                .andExpect(status().isOk());
        long version = getVersionFromResponse(get);

        // First update succeeds
        mvc.perform(patch("/api/workspaces/" + workspaceId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "עדכון 1", "version", version))))
                .andExpect(status().isOk());

        // Second update with the old (stale) version fails
        mvc.perform(patch("/api/workspaces/" + workspaceId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "עדכון 2", "version", version))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("עודכנו")));
    }

    @Test
    void update_workspace_without_version_still_works() throws Exception {
        mvc.perform(patch("/api/workspaces/" + workspaceId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "ללא גרסה"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("ללא גרסה"));
    }

    // ── Category optimistic locking ─────────────────────────────────────

    @Test
    void update_category_with_correct_version_succeeds() throws Exception {
        ResultActions get = mvc.perform(get("/api/categories/" + categoryId)
                .header("Authorization", getBearerToken()))
                .andExpect(status().isOk());
        long version = getVersionFromResponse(get);

        mvc.perform(patch("/api/categories/" + categoryId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "nameHe", "שם קטגוריה חדש", "version", version))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nameHe").value("שם קטגוריה חדש"))
                .andExpect(jsonPath("$.version").value(version + 1));
    }

    @Test
    void update_category_with_stale_version_returns_409() throws Exception {
        ResultActions get = mvc.perform(get("/api/categories/" + categoryId)
                .header("Authorization", getBearerToken()))
                .andExpect(status().isOk());
        long version = getVersionFromResponse(get);

        mvc.perform(patch("/api/categories/" + categoryId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "iconId", "dairy", "version", version))))
                .andExpect(status().isOk());

        mvc.perform(patch("/api/categories/" + categoryId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "iconId", "meat", "version", version))))
                .andExpect(status().isConflict());
    }

    // ── Product optimistic locking ──────────────────────────────────────

    @Test
    void update_product_with_correct_version_succeeds() throws Exception {
        ResultActions get = mvc.perform(get("/api/products/" + productId)
                .header("Authorization", getBearerToken()))
                .andExpect(status().isOk());
        long version = getVersionFromResponse(get);

        mvc.perform(patch("/api/products/" + productId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "note", "הערה חדשה", "version", version))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.note").value("הערה חדשה"))
                .andExpect(jsonPath("$.version").value(version + 1));
    }

    @Test
    void update_product_with_stale_version_returns_409() throws Exception {
        ResultActions get = mvc.perform(get("/api/products/" + productId)
                .header("Authorization", getBearerToken()))
                .andExpect(status().isOk());
        long version = getVersionFromResponse(get);

        mvc.perform(patch("/api/products/" + productId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "note", "הערה 1", "version", version))))
                .andExpect(status().isOk());

        mvc.perform(patch("/api/products/" + productId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "note", "הערה 2", "version", version))))
                .andExpect(status().isConflict());
    }

    // ── List optimistic locking ─────────────────────────────────────────

    @Test
    void update_list_with_correct_version_succeeds() throws Exception {
        String listId = createList("רשימה לגרסה");

        ResultActions get = mvc.perform(get("/api/lists/" + listId)
                .header("Authorization", getBearerToken()))
                .andExpect(status().isOk());
        long version = getVersionFromResponse(get);

        mvc.perform(put("/api/lists/" + listId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "שם חדש", "version", version))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("שם חדש"))
                .andExpect(jsonPath("$.version").value(version + 1));
    }

    @Test
    void update_list_with_stale_version_returns_409() throws Exception {
        String listId = createList("רשימה לקונפליקט");

        ResultActions get = mvc.perform(get("/api/lists/" + listId)
                .header("Authorization", getBearerToken()))
                .andExpect(status().isOk());
        long version = getVersionFromResponse(get);

        mvc.perform(put("/api/lists/" + listId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "עדכון 1", "version", version))))
                .andExpect(status().isOk());

        mvc.perform(put("/api/lists/" + listId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "עדכון 2", "version", version))))
                .andExpect(status().isConflict());
    }

    // ── ListItem optimistic locking ─────────────────────────────────────

    @Test
    void update_list_item_with_correct_version_succeeds() throws Exception {
        String listId = createList("פריט רשימה");
        ResultActions addResult = mvc.perform(post("/api/lists/" + listId + "/items")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", productId.toString(), "quantity", 1))))
                .andExpect(status().isOk());

        String itemId = getIdFromResponse(addResult);
        long version = getVersionFromResponse(addResult);

        mvc.perform(patch("/api/lists/" + listId + "/items/" + itemId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "quantity", 5, "version", version))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(5))
                .andExpect(jsonPath("$.version").value(version + 1));
    }

    @Test
    void update_list_item_with_stale_version_returns_409() throws Exception {
        String listId = createList("פריט קונפליקט");
        ResultActions addResult = mvc.perform(post("/api/lists/" + listId + "/items")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", productId.toString(), "quantity", 1))))
                .andExpect(status().isOk());

        String itemId = getIdFromResponse(addResult);
        long version = getVersionFromResponse(addResult);

        mvc.perform(patch("/api/lists/" + listId + "/items/" + itemId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "quantity", 3, "version", version))))
                .andExpect(status().isOk());

        mvc.perform(patch("/api/lists/" + listId + "/items/" + itemId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "quantity", 7, "version", version))))
                .andExpect(status().isConflict());
    }

    @Test
    void update_list_item_without_version_still_works() throws Exception {
        String listId = createList("פריט ללא גרסה");
        ResultActions addResult = mvc.perform(post("/api/lists/" + listId + "/items")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", productId.toString(), "quantity", 1))))
                .andExpect(status().isOk());

        String itemId = getIdFromResponse(addResult);

        mvc.perform(patch("/api/lists/" + listId + "/items/" + itemId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("crossedOff", true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.crossedOff").value(true));
    }

    // ── Multi-user concurrent modification ──────────────────────────────

    @Test
    void two_users_cannot_update_same_category_concurrently() throws Exception {
        // Create second user and invite to workspace
        User other = userRepository.save(User.builder()
                .email("other@example.com")
                .passwordHash(passwordEncoder.encode("pass123"))
                .displayName("Other")
                .locale("he")
                .build());
        String otherToken = login("other@example.com", "pass123");

        mvc.perform(post("/api/workspaces/" + workspaceId + "/members")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "other@example.com"))))
                .andExpect(status().isOk());

        // Both users read the current version
        ResultActions getResult = mvc.perform(get("/api/categories/" + categoryId)
                .header("Authorization", getBearerToken()))
                .andExpect(status().isOk());
        long version = getVersionFromResponse(getResult);

        // User A updates successfully with the version
        mvc.perform(patch("/api/categories/" + categoryId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "imageUrl", "https://a.com/img.jpg", "version", version))))
                .andExpect(status().isOk());

        // User B tries to update with the same (now stale) version — should fail
        mvc.perform(patch("/api/categories/" + categoryId)
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "imageUrl", "https://b.com/img.jpg", "version", version))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("עודכנו")));
    }

    @Test
    void two_users_cannot_update_same_list_item_concurrently() throws Exception {
        // Create second user and invite
        User other = userRepository.save(User.builder()
                .email("other@example.com")
                .passwordHash(passwordEncoder.encode("pass123"))
                .displayName("Other")
                .locale("he")
                .build());
        String otherToken = login("other@example.com", "pass123");

        mvc.perform(post("/api/workspaces/" + workspaceId + "/members")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "other@example.com"))))
                .andExpect(status().isOk());

        // Create list and add item
        String listId = createList("שיתופי");
        ResultActions addResult = mvc.perform(post("/api/lists/" + listId + "/items")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", productId.toString(), "quantity", 1))))
                .andExpect(status().isOk());

        String itemId = getIdFromResponse(addResult);
        long version = getVersionFromResponse(addResult);

        // User A updates the note
        mvc.perform(patch("/api/lists/" + listId + "/items/" + itemId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "note", "הערה מ-A", "version", version))))
                .andExpect(status().isOk());

        // User B tries to update the quantity with the stale version
        mvc.perform(patch("/api/lists/" + listId + "/items/" + itemId)
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "quantity", 5, "version", version))))
                .andExpect(status().isConflict());
    }

    @Test
    void version_increments_with_each_update() throws Exception {
        // Version should increment on each successful update
        ResultActions get = mvc.perform(get("/api/categories/" + categoryId)
                .header("Authorization", getBearerToken()))
                .andExpect(status().isOk());
        long v0 = getVersionFromResponse(get);

        ResultActions u1 = mvc.perform(patch("/api/categories/" + categoryId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "iconId", "icon1", "version", v0))))
                .andExpect(status().isOk());
        long v1 = getVersionFromResponse(u1);

        ResultActions u2 = mvc.perform(patch("/api/categories/" + categoryId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "iconId", "icon2", "version", v1))))
                .andExpect(status().isOk());
        long v2 = getVersionFromResponse(u2);

        ResultActions u3 = mvc.perform(patch("/api/categories/" + categoryId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "iconId", "icon3", "version", v2))))
                .andExpect(status().isOk());
        long v3 = getVersionFromResponse(u3);

        // Each should be exactly +1
        org.assertj.core.api.Assertions.assertThat(v1).isEqualTo(v0 + 1);
        org.assertj.core.api.Assertions.assertThat(v2).isEqualTo(v0 + 2);
        org.assertj.core.api.Assertions.assertThat(v3).isEqualTo(v0 + 3);
    }

    // ── Reorder should not bump version for unmoved items ────────────────

    @Test
    void reorder_items_does_not_bump_version_when_order_unchanged() throws Exception {
        String listId = createList("סדר רשימה");

        // Add three items
        ResultActions a1 = mvc.perform(post("/api/lists/" + listId + "/items")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "customNameHe", "פריט א", "quantity", 1))))
                .andExpect(status().isOk());
        String id1 = getIdFromResponse(a1);

        ResultActions a2 = mvc.perform(post("/api/lists/" + listId + "/items")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "customNameHe", "פריט ב", "quantity", 1))))
                .andExpect(status().isOk());
        String id2 = getIdFromResponse(a2);

        ResultActions a3 = mvc.perform(post("/api/lists/" + listId + "/items")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "customNameHe", "פריט ג", "quantity", 1))))
                .andExpect(status().isOk());
        String id3 = getIdFromResponse(a3);

        // First reorder assigns distinct sortOrder values
        mvc.perform(put("/api/lists/" + listId + "/items/reorder")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "itemIds", java.util.List.of(id3, id1, id2)))))
                .andExpect(status().isNoContent());

        // Capture versions after the first reorder
        String body = mvc.perform(get("/api/lists/" + listId + "/items")
                        .header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        var items = objectMapper.readTree(body);
        long v1Mid = -1, v2Mid = -1, v3Mid = -1;
        for (var item : items) {
            String itemId = item.get("id").asText();
            if (itemId.equals(id1)) v1Mid = item.get("version").asLong();
            if (itemId.equals(id2)) v2Mid = item.get("version").asLong();
            if (itemId.equals(id3)) v3Mid = item.get("version").asLong();
        }

        // Reorder with the SAME order — no versions should change
        mvc.perform(put("/api/lists/" + listId + "/items/reorder")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "itemIds", java.util.List.of(id3, id1, id2)))))
                .andExpect(status().isNoContent());

        String body2 = mvc.perform(get("/api/lists/" + listId + "/items")
                        .header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        var items2 = objectMapper.readTree(body2);
        for (var item : items2) {
            String itemId = item.get("id").asText();
            long versionAfter = item.get("version").asLong();
            if (itemId.equals(id1)) org.assertj.core.api.Assertions.assertThat(versionAfter).isEqualTo(v1Mid);
            if (itemId.equals(id2)) org.assertj.core.api.Assertions.assertThat(versionAfter).isEqualTo(v2Mid);
            if (itemId.equals(id3)) org.assertj.core.api.Assertions.assertThat(versionAfter).isEqualTo(v3Mid);
        }
    }
}
