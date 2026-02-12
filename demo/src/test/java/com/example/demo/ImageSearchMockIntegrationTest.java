package com.example.demo;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Verifies the full image search flow (controller + HTTP client + JSON parsing)
 * by mocking the Unsplash API with WireMock. Avoids real HTTPS so SSL/certificate
 * issues (e.g. PKIX) and network are not required.
 */
class ImageSearchMockIntegrationTest extends AbstractIntegrationTest {

    private static WireMockServer wireMock;

    @BeforeAll
    static void startWireMock() {
        wireMock = new WireMockServer(WireMockConfiguration.wireMockConfig().dynamicPort());
        wireMock.start();
        String unsplashBody = """
                {
                  "total": 1,
                  "total_pages": 1,
                  "results": [
                    {
                      "id": "test1",
                      "urls": {
                        "raw": "https://example.com/raw.jpg",
                        "full": "https://example.com/full.jpg",
                        "regular": "https://example.com/regular.jpg",
                        "small": "https://example.com/small.jpg",
                        "thumb": "https://example.com/thumb.jpg"
                      }
                    }
                  ]
                }
                """;
        wireMock.stubFor(
                get(urlPathEqualTo("/search/photos"))
                        .willReturn(aResponse()
                                .withStatus(200)
                                .withHeader("Content-Type", "application/json")
                                .withBody(unsplashBody)));
    }

    @AfterAll
    static void stopWireMock() {
        if (wireMock != null) {
            wireMock.stop();
        }
    }

    @DynamicPropertySource
    static void wireMockProps(DynamicPropertyRegistry registry) {
        registry.add("listy.unsplash.api-url", () -> "http://localhost:" + wireMock.port());
        registry.add("listy.unsplash.access-key", () -> "test-key");
    }

    @Test
    void search_returns_mocked_unsplash_results_when_key_and_api_configured() throws Exception {
        mvc.perform(MockMvcRequestBuilders.get("/api/images/search")
                        .header("Authorization", getBearerToken())
                        .param("q", "milk")
                        .param("per_page", "12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.error").doesNotExist())
                .andExpect(jsonPath("$.results").isArray())
                .andExpect(jsonPath("$.results.length()").value(1))
                .andExpect(jsonPath("$.results[0].url").value("https://example.com/regular.jpg"))
                .andExpect(jsonPath("$.results[0].thumbUrl").value("https://example.com/thumb.jpg"));
    }
}
