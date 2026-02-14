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
    void search_returns_500_with_error_message_when_api_key_not_configured() throws Exception {
        mvc.perform(get("/api/images/search")
                        .header("Authorization", getBearerToken())
                        .param("q", "milk"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").exists());
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
