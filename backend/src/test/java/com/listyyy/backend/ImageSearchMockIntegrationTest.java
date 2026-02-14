package com.listyyy.backend;

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
 * by mocking GIPHY and Pixabay APIs with WireMock.
 */
class ImageSearchMockIntegrationTest extends AbstractIntegrationTest {

    private static WireMockServer wireMock;

    @BeforeAll
    static void startWireMock() {
        wireMock = new WireMockServer(WireMockConfiguration.wireMockConfig().dynamicPort());
        wireMock.start();

        // ── GIPHY sticker stub ──
        String giphyBody = """
                {
                  "data": [
                    {
                      "type": "gif",
                      "id": "test1",
                      "images": {
                        "fixed_height": {
                          "url": "https://example.com/fixed_height.gif",
                          "width": "200",
                          "height": "200"
                        },
                        "fixed_height_small": {
                          "url": "https://example.com/fixed_height_small.gif",
                          "width": "100",
                          "height": "100"
                        }
                      }
                    }
                  ],
                  "pagination": {
                    "total_count": 1,
                    "count": 1,
                    "offset": 0
                  }
                }
                """;
        wireMock.stubFor(
                get(urlPathEqualTo("/v1/stickers/search"))
                        .willReturn(aResponse()
                                .withStatus(200)
                                .withHeader("Content-Type", "application/json")
                                .withBody(giphyBody)));

        // ── Pixabay stub ──
        String pixabayBody = """
                {
                  "total": 1,
                  "totalHits": 1,
                  "hits": [
                    {
                      "id": 123,
                      "webformatURL": "https://example.com/milk_web.jpg",
                      "previewURL": "https://example.com/milk_preview.jpg",
                      "largeImageURL": "https://example.com/milk_large.jpg"
                    }
                  ]
                }
                """;
        wireMock.stubFor(
                get(urlPathEqualTo("/api/"))
                        .willReturn(aResponse()
                                .withStatus(200)
                                .withHeader("Content-Type", "application/json")
                                .withBody(pixabayBody)));
    }

    @AfterAll
    static void stopWireMock() {
        if (wireMock != null) {
            wireMock.stop();
        }
    }

    @DynamicPropertySource
    static void wireMockProps(DynamicPropertyRegistry registry) {
        String baseUrl = "http://localhost:" + wireMock.port();
        registry.add("listyyy.giphy.api-url", () -> baseUrl);
        registry.add("listyyy.giphy.api-key", () -> "test-giphy-key");
        registry.add("listyyy.pixabay.api-url", () -> baseUrl);
        registry.add("listyyy.pixabay.api-key", () -> "test-pixabay-key");
    }

    @Test
    void search_giphy_returns_sticker_results() throws Exception {
        mvc.perform(MockMvcRequestBuilders.get("/api/images/search")
                        .header("Authorization", getBearerToken())
                        .param("q", "milk")
                        .param("per_page", "12")
                        .param("source", "giphy"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.error").doesNotExist())
                .andExpect(jsonPath("$.results").isArray())
                .andExpect(jsonPath("$.results.length()").value(1))
                .andExpect(jsonPath("$.results[0].url").value("https://example.com/fixed_height.gif"))
                .andExpect(jsonPath("$.results[0].thumbUrl").value("https://example.com/fixed_height_small.gif"));
    }

    @Test
    void search_pixabay_returns_image_results() throws Exception {
        mvc.perform(MockMvcRequestBuilders.get("/api/images/search")
                        .header("Authorization", getBearerToken())
                        .param("q", "milk")
                        .param("per_page", "12")
                        .param("source", "pixabay"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.error").doesNotExist())
                .andExpect(jsonPath("$.results").isArray())
                .andExpect(jsonPath("$.results.length()").value(1))
                .andExpect(jsonPath("$.results[0].url").value("https://example.com/milk_web.jpg"))
                .andExpect(jsonPath("$.results[0].thumbUrl").value("https://example.com/milk_preview.jpg"));
    }

    @Test
    void search_defaults_to_giphy_when_no_source_param() throws Exception {
        mvc.perform(MockMvcRequestBuilders.get("/api/images/search")
                        .header("Authorization", getBearerToken())
                        .param("q", "milk")
                        .param("per_page", "12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.error").doesNotExist())
                .andExpect(jsonPath("$.results[0].url").value("https://example.com/fixed_height.gif"));
    }
}
