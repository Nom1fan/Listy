package com.listyyy.backend;

import com.listyyy.backend.list.GroceryList;
import com.listyyy.backend.productbank.Category;
import com.listyyy.backend.productbank.Product;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ProductIntegrationTest extends AbstractIntegrationTest {

    @Test
    void list_products_requires_auth() throws Exception {
        mvc.perform(get("/api/products")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/products").header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].nameHe").value("אורז"))
                .andExpect(jsonPath("$[0].categoryIconId").value("groceries"));
    }

    @Test
    void get_product_by_id_requires_auth() throws Exception {
        mvc.perform(get("/api/products/" + productId)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/products/" + productId).header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(productId.toString()))
                .andExpect(jsonPath("$.nameHe").value("אורז"))
                .andExpect(jsonPath("$.categoryIconId").value("groceries"));
    }

    @Test
    void update_product_image_requires_auth() throws Exception {
        mvc.perform(patch("/api/products/" + productId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("imageUrl", "http://example.com/img.png"))))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void update_product_image() throws Exception {
        mvc.perform(patch("/api/products/" + productId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("imageUrl", "/uploads/product/x.png"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imageUrl").value("/uploads/product/x.png"));
    }

    @Test
    void update_product_icon_id() throws Exception {
        mvc.perform(patch("/api/products/" + productId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("imageUrl", "", "iconId", "carrot"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.iconId").value("carrot"));
        mvc.perform(get("/api/products/" + productId).header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.iconId").value("carrot"));
    }

    @Test
    void cannot_create_duplicate_product_in_same_category() throws Exception {
        // "אורז" already exists in the default category (created in baseSetUp)
        mvc.perform(post("/api/products")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "categoryId", categoryId.toString(),
                                "nameHe", "אורז"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("כבר קיים")));
    }

    @Test
    void can_create_same_product_name_in_different_category() throws Exception {
        // Create a second category
        Category cat2 = categoryRepository.save(Category.builder()
                .workspace(workspaceRepository.findById(workspaceId).orElseThrow())
                .nameHe("ירקות")
                .sortOrder(1)
                .build());

        // "אורז" in a different category should succeed
        mvc.perform(post("/api/products")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "categoryId", cat2.getId().toString(),
                                "nameHe", "אורז"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nameHe").value("אורז"));
    }

    @Test
    void cannot_rename_product_to_existing_name_in_same_category() throws Exception {
        // Create a second product in the same category
        mvc.perform(post("/api/products")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "categoryId", categoryId.toString(),
                                "nameHe", "פסטה"))))
                .andExpect(status().isOk());

        // Try to rename "אורז" to "פסטה"
        mvc.perform(patch("/api/products/" + productId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("nameHe", "פסטה"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("כבר קיים")));
    }

    @Test
    void can_rename_product_to_its_own_name() throws Exception {
        // Renaming to the same name should succeed (no-op)
        mvc.perform(patch("/api/products/" + productId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("nameHe", "אורז"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nameHe").value("אורז"));
    }

    @Test
    void create_product_requires_auth() throws Exception {
        mvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "categoryId", categoryId.toString(),
                                "nameHe", "חלב"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void create_product() throws Exception {
        mvc.perform(post("/api/products")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "categoryId", categoryId.toString(),
                                "nameHe", "חלב",
                                "defaultUnit", "ליטר"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nameHe").value("חלב"))
                .andExpect(jsonPath("$.defaultUnit").value("ליטר"))
                .andExpect(jsonPath("$.categoryId").value(categoryId.toString()));
    }

    @Test
    void delete_product_requires_auth() throws Exception {
        mvc.perform(delete("/api/products/" + productId))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void delete_product() throws Exception {
        mvc.perform(delete("/api/products/" + productId)
                        .header("Authorization", getBearerToken()))
                .andExpect(status().isNoContent());

        // Verify product is gone
        mvc.perform(get("/api/products/" + productId)
                        .header("Authorization", getBearerToken()))
                .andExpect(status().isNotFound());
    }

    @Test
    void move_product_to_different_category() throws Exception {
        // Create a second category
        Category cat2 = categoryRepository.save(Category.builder()
                .workspace(workspaceRepository.findById(workspaceId).orElseThrow())
                .nameHe("ירקות")
                .sortOrder(1)
                .build());

        // Move product from מכולת to ירקות
        mvc.perform(patch("/api/products/" + productId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("categoryId", cat2.getId().toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoryId").value(cat2.getId().toString()));

        // Verify the product is now in the new category
        mvc.perform(get("/api/products/" + productId).header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoryId").value(cat2.getId().toString()));
    }

    @Test
    void cannot_move_product_to_category_with_duplicate_name() throws Exception {
        // Create a second category with a product of the same name
        Category cat2 = categoryRepository.save(Category.builder()
                .workspace(workspaceRepository.findById(workspaceId).orElseThrow())
                .nameHe("ירקות")
                .sortOrder(1)
                .build());
        productRepository.save(Product.builder()
                .category(cat2)
                .nameHe("אורז")
                .defaultUnit("קילו")
                .build());

        // Try to move our product (also named "אורז") to the same category
        mvc.perform(patch("/api/products/" + productId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("categoryId", cat2.getId().toString()))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("כבר קיים")));
    }

    @Test
    void move_product_to_same_category_is_noop() throws Exception {
        // Moving to the same category should succeed without error
        mvc.perform(patch("/api/products/" + productId)
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("categoryId", categoryId.toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoryId").value(categoryId.toString()));
    }

    @Test
    void delete_product_also_removes_referencing_list_items() throws Exception {
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

        // Verify item is on the list
        mvc.perform(get("/api/lists/" + list.getId() + "/items")
                        .header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        // Delete the product
        mvc.perform(delete("/api/products/" + productId)
                        .header("Authorization", getBearerToken()))
                .andExpect(status().isNoContent());

        // Verify the list item was also removed
        mvc.perform(get("/api/lists/" + list.getId() + "/items")
                        .header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }
}
