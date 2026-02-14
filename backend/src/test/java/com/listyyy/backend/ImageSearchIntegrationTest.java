package com.listyyy.backend;

import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ImageSearchIntegrationTest extends AbstractIntegrationTest {

    @Test
    void search_requires_auth() throws Exception {
        mvc.perform(get("/api/images/search").param("q", "milk"))
                .andExpect(status().is4xxClientError()); // 401 or 403 when unauthenticated
    }

    @Test
    void search_returns_empty_results_and_error_message_when_authenticated_and_no_key_configured() throws Exception {
        mvc.perform(get("/api/images/search")
                        .header("Authorization", getBearerToken())
                        .param("q", "milk"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results").isArray())
                .andExpect(jsonPath("$.results").isEmpty())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void search_returns_400_or_empty_when_query_empty() throws Exception {
        mvc.perform(get("/api/images/search")
                        .header("Authorization", getBearerToken())
                        .param("q", ""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results").isArray());
    }
}
