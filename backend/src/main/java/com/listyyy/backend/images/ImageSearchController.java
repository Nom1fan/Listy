package com.listyyy.backend.images;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Proxies image search to GIPHY Stickers or Pixabay so API keys stay server-side.
 */
@RestController
@RequiredArgsConstructor
public class ImageSearchController {

    // ── GIPHY config ──
    @Value("${listyyy.giphy.api-key:}")
    private String giphyApiKey;

    @Value("${listyyy.giphy.api-url:}")
    private String giphyApiUrl;

    @Value("${listyyy.giphy.insecure-ssl:false}")
    private boolean giphyInsecureSsl;

    // ── Pixabay config ──
    @Value("${listyyy.pixabay.api-key:}")
    private String pixabayApiKey;

    @Value("${listyyy.pixabay.api-url:}")
    private String pixabayApiUrl;

    @Value("${listyyy.pixabay.insecure-ssl:false}")
    private boolean pixabayInsecureSsl;

    @GetMapping("/api/images/search")
    public ResponseEntity<ImageSearchResponse> search(
            @RequestParam("q") String query,
            @RequestParam(value = "per_page", defaultValue = "12") int perPage,
            @RequestParam(value = "source", defaultValue = "giphy") String source) {
        String q = query == null ? "" : query.trim();
        if (q.isEmpty()) {
            return ResponseEntity.ok(new ImageSearchResponse(List.of()));
        }
        List<ImageSearchResult> results = "pixabay".equalsIgnoreCase(source)
                ? searchPixabay(q, perPage)
                : searchGiphy(q, perPage);
        return ResponseEntity.ok(new ImageSearchResponse(results));
    }

    private List<ImageSearchResult> searchGiphy(String query, int perPage) {
        if (giphyApiKey == null || giphyApiKey.isBlank()) {
            throw new RuntimeException("לא הוגדר מפתח GIPHY. הגדר GIPHY_API_KEY בשרת.");
        }
        ImageSearchGiphyService service = giphyApiUrl != null && !giphyApiUrl.isBlank()
                ? new ImageSearchGiphyService(giphyApiUrl, giphyApiKey, giphyInsecureSsl)
                : new ImageSearchGiphyService(giphyApiKey, giphyInsecureSsl);
        return service.search(query, Math.min(30, Math.max(1, perPage)));
    }

    private List<ImageSearchResult> searchPixabay(String query, int perPage) {
        if (pixabayApiKey == null || pixabayApiKey.isBlank()) {
            throw new RuntimeException("לא הוגדר מפתח Pixabay. הגדר PIXABAY_API_KEY בשרת.");
        }
        ImageSearchPixabayService service = pixabayApiUrl != null && !pixabayApiUrl.isBlank()
                ? new ImageSearchPixabayService(pixabayApiUrl, pixabayApiKey, pixabayInsecureSsl)
                : new ImageSearchPixabayService(pixabayApiKey, pixabayInsecureSsl);
        return service.search(query, Math.min(30, Math.max(3, perPage)));
    }

    public record ImageSearchResponse(List<ImageSearchResult> results) {}
    public record ImageSearchResult(String url, String thumbUrl) {}
}
