package com.example.demo.images;

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

class ImageSearchService {

    private static final String DEFAULT_BASE_URL = "https://api.unsplash.com";
    private final String baseUrl;
    private final String accessKey;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    ImageSearchService(String accessKey) {
        this(DEFAULT_BASE_URL, accessKey, false);
    }

    ImageSearchService(String accessKey, boolean insecureSsl) {
        this(DEFAULT_BASE_URL, accessKey, insecureSsl);
    }

    ImageSearchService(String baseUrl, String accessKey) {
        this(baseUrl, accessKey, false);
    }

    ImageSearchService(String baseUrl, String accessKey, boolean insecureSsl) {
        this.baseUrl = baseUrl != null && !baseUrl.isBlank() ? baseUrl.replaceAll("/$", "") : DEFAULT_BASE_URL;
        this.accessKey = accessKey;
        this.httpClient = buildHttpClient(insecureSsl);
    }

    private static HttpClient buildHttpClient(boolean insecureSsl) {
        HttpClient.Builder builder = HttpClient.newBuilder();
        if (insecureSsl) {
            try {
                SSLContext sslContext = SSLContext.getInstance("TLS");
                sslContext.init(null, new TrustManager[]{new X509TrustManager() {
                    @Override
                    public void checkClientTrusted(X509Certificate[] chain, String authType) {}
                    @Override
                    public void checkServerTrusted(X509Certificate[] chain, String authType) {}
                    @Override
                    public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
                }}, new SecureRandom());
                builder.sslContext(sslContext);
            } catch (Exception e) {
                throw new RuntimeException("Failed to create relaxed SSL context for Unsplash client", e);
            }
        }
        return builder.build();
    }

    List<ImageSearchController.ImageSearchResult> search(String query, int perPage) throws Exception {
        String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
        String url = baseUrl + "/search/photos?query=" + encoded + "&per_page=" + perPage;
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", "Client-ID " + accessKey)
                .header("Accept-Version", "v1")
                .GET()
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() != 200) {
            String body = response.body();
            String msg = body != null && body.length() < 200 ? body : "Unsplash API returned " + response.statusCode();
            throw new RuntimeException(msg);
        }
        JsonNode root = objectMapper.readTree(response.body());
        JsonNode results = root.get("results");
        if (results == null || !results.isArray()) {
            return List.of();
        }
        List<ImageSearchController.ImageSearchResult> list = new ArrayList<>();
        for (JsonNode photo : results) {
            JsonNode urls = photo.get("urls");
            if (urls == null) continue;
            String regular = urls.has("regular") ? urls.get("regular").asText() : null;
            String thumb = urls.has("thumb") ? urls.get("thumb").asText() : (urls.has("small") ? urls.get("small").asText() : regular);
            if (regular != null && !regular.isBlank()) {
                list.add(new ImageSearchController.ImageSearchResult(regular, thumb != null ? thumb : regular));
            }
        }
        return list;
    }
}
