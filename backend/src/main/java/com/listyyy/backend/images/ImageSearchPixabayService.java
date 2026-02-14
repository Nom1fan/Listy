package com.listyyy.backend.images;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Searches Pixabay API for still images (photos + illustrations).
 * See https://pixabay.com/api/docs/
 */
class ImageSearchPixabayService {

    private static final String DEFAULT_BASE_URL = "https://pixabay.com";
    private final String baseUrl;
    private final String apiKey;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    ImageSearchPixabayService(String apiKey) {
        this(DEFAULT_BASE_URL, apiKey, false);
    }

    ImageSearchPixabayService(String apiKey, boolean insecureSsl) {
        this(DEFAULT_BASE_URL, apiKey, insecureSsl);
    }

    ImageSearchPixabayService(String baseUrl, String apiKey) {
        this(baseUrl, apiKey, false);
    }

    ImageSearchPixabayService(String baseUrl, String apiKey, boolean insecureSsl) {
        this.baseUrl = baseUrl != null && !baseUrl.isBlank() ? baseUrl.replaceAll("/$", "") : DEFAULT_BASE_URL;
        this.apiKey = apiKey;
        this.httpClient = InsecureSslHelper.buildHttpClient(insecureSsl);
    }

    List<ImageSearchController.ImageSearchResult> search(String query, int perPage) throws Exception {
        String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
        int num = Math.min(200, Math.max(3, perPage));
        String url = baseUrl + "/api/?key=" + apiKey
                + "&q=" + encoded
                + "&per_page=" + num
                + "&image_type=all"
                + "&safesearch=true";
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Accept", "application/json")
                .GET()
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() != 200) {
            String body = response.body();
            String msg = body != null && body.length() < 200 ? body : "שגיאת Pixabay API: " + response.statusCode();
            throw new RuntimeException(msg);
        }
        JsonNode root = objectMapper.readTree(response.body());
        JsonNode hits = root.get("hits");
        if (hits == null || !hits.isArray()) {
            return List.of();
        }
        List<ImageSearchController.ImageSearchResult> list = new ArrayList<>();
        for (JsonNode hit : hits) {
            String mainUrl = hit.has("webformatURL") ? hit.get("webformatURL").asText() : null;
            String thumbUrl = hit.has("previewURL") ? hit.get("previewURL").asText() : mainUrl;
            if (mainUrl != null && !mainUrl.isBlank()) {
                list.add(new ImageSearchController.ImageSearchResult(mainUrl, thumbUrl != null ? thumbUrl : mainUrl));
            }
        }
        return list;
    }
}
