package com.listyyy.backend.images;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.List;

/**
 * Searches GIPHY Stickers API for emoji-like / animated images.
 * See https://developers.giphy.com/docs/api/endpoint/#search
 */
class ImageSearchGiphyService {

    private static final String DEFAULT_BASE_URL = "https://api.giphy.com";
    private final String baseUrl;
    private final String apiKey;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    ImageSearchGiphyService(String apiKey) {
        this(DEFAULT_BASE_URL, apiKey, false);
    }

    ImageSearchGiphyService(String apiKey, boolean insecureSsl) {
        this(DEFAULT_BASE_URL, apiKey, insecureSsl);
    }

    ImageSearchGiphyService(String baseUrl, String apiKey) {
        this(baseUrl, apiKey, false);
    }

    ImageSearchGiphyService(String baseUrl, String apiKey, boolean insecureSsl) {
        this.baseUrl = baseUrl != null && !baseUrl.isBlank() ? baseUrl.replaceAll("/$", "") : DEFAULT_BASE_URL;
        this.apiKey = apiKey;
        this.httpClient = InsecureSslHelper.buildHttpClient(insecureSsl);
    }

    List<ImageSearchController.ImageSearchResult> search(String query, int perPage) {
        String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
        String url = baseUrl + "/v1/stickers/search?api_key=" + apiKey
                + "&q=" + encoded
                + "&limit=" + perPage
                + "&rating=g";
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Accept", "application/json")
                .GET()
                .build();
        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new RuntimeException("חיפוש GIPHY נכשל: " + e.getMessage(), e);
        }
        if (response.statusCode() != 200) {
            String body = response.body();
            String msg = body != null && body.length() < 200 ? body : "שגיאת GIPHY API: " + response.statusCode();
            throw new RuntimeException(msg);
        }
        JsonNode root;
        try {
            root = objectMapper.readTree(response.body());
        } catch (Exception e) {
            throw new RuntimeException("שגיאה בפענוח תשובת GIPHY", e);
        }
        JsonNode data = root.get("data");
        if (data == null || !data.isArray()) {
            return List.of();
        }
        List<ImageSearchController.ImageSearchResult> list = new ArrayList<>();
        for (JsonNode gif : data) {
            JsonNode images = gif.get("images");
            if (images == null) continue;
            String mainUrl = extractUrl(images, "fixed_height");
            String thumbUrl = extractUrl(images, "fixed_height_small");
            if (thumbUrl == null) thumbUrl = extractUrl(images, "preview_gif");
            if (mainUrl != null && !mainUrl.isBlank()) {
                list.add(new ImageSearchController.ImageSearchResult(mainUrl, thumbUrl != null ? thumbUrl : mainUrl));
            }
        }
        return list;
    }

    private static String extractUrl(JsonNode images, String key) {
        JsonNode node = images.get(key);
        if (node == null) return null;
        JsonNode urlNode = node.get("url");
        return urlNode != null ? urlNode.asText() : null;
    }
}
