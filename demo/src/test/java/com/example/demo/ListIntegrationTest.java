package com.example.demo;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ListIntegrationTest extends AbstractIntegrationTest {

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
