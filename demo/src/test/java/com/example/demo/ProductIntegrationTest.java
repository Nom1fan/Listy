package com.example.demo;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ProductIntegrationTest extends AbstractIntegrationTest {

    @Test
    void list_products_public() throws Exception {
        mvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].nameHe").value("אורז"))
                .andExpect(jsonPath("$[0].categoryIconId").value("groceries"));
    }

    @Test
    void get_product_by_id_public() throws Exception {
        mvc.perform(get("/api/products/" + productId))
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
        mvc.perform(get("/api/products/" + productId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.iconId").value("carrot"));
    }
}
