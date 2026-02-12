package com.example.demo;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class CategoryIntegrationTest extends AbstractIntegrationTest {

    @Test
    void list_categories_public() throws Exception {
        mvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].nameHe").value("מכולת"));
    }

    @Test
    void get_category_by_id_public() throws Exception {
        mvc.perform(get("/api/categories/" + categoryId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(categoryId.toString()))
                .andExpect(jsonPath("$.nameHe").value("מכולת"))
                .andExpect(jsonPath("$.iconId").value("groceries"));
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
                .andExpect(jsonPath("$.iconId").value("leaf"));

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

        mvc.perform(get("/api/categories/" + id)).andExpect(status().isNotFound());
    }
}
