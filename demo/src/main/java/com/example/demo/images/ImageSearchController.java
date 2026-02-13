package com.example.demo.images;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Proxies image search to Unsplash API so the access key stays server-side.
 * Set listyyy.unsplash.access-key or UNSPLASH_ACCESS_KEY to enable.
 */
@RestController
@RequiredArgsConstructor
public class ImageSearchController {

    private static final Logger log = LoggerFactory.getLogger(ImageSearchController.class);

    @Value("${listyyy.unsplash.access-key:}")
    private String unsplashAccessKey;

    @Value("${listyyy.unsplash.api-url:}")
    private String unsplashApiUrl;

    @Value("${listyyy.unsplash.insecure-ssl:false}")
    private boolean unsplashInsecureSsl;

    @GetMapping("/api/images/search")
    public ResponseEntity<ImageSearchResponse> search(
            @RequestParam("q") String query,
            @RequestParam(value = "per_page", defaultValue = "12") int perPage) {
        if (unsplashAccessKey == null || unsplashAccessKey.isBlank()) {
            log.debug("Unsplash image search: no key configured");
            return ResponseEntity.ok(new ImageSearchResponse(List.of(), "לא הוגדר מפתח Unsplash. הגדר UNSPLASH_ACCESS_KEY או listyyy.unsplash.access-key בשרת."));
        }
        String q = query == null ? "" : query.trim();
        if (q.isEmpty()) {
            return ResponseEntity.ok(new ImageSearchResponse(List.of(), null));
        }
        try {
            ImageSearchService service = unsplashApiUrl != null && !unsplashApiUrl.isBlank()
                    ? new ImageSearchService(unsplashApiUrl, unsplashAccessKey, unsplashInsecureSsl)
                    : new ImageSearchService(unsplashAccessKey, unsplashInsecureSsl);
            List<ImageSearchResult> results = service.search(q, Math.min(30, Math.max(1, perPage)));
            return ResponseEntity.ok(new ImageSearchResponse(results, null));
        } catch (Throwable t) {
            log.warn("Image search failed: {}", t.getMessage(), t);
            String msg = t.getMessage() != null && !t.getMessage().isBlank() ? t.getMessage() : "חיפוש נכשל";
            return ResponseEntity.ok(new ImageSearchResponse(List.of(), msg));
        }
    }

    public record ImageSearchResponse(List<ImageSearchResult> results, String error) {}
    public record ImageSearchResult(String url, String thumbUrl) {}
}
