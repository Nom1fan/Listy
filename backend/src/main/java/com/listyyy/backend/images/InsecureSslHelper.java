package com.listyyy.backend.images;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.net.http.HttpClient;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;

/**
 * Shared helper for building an HttpClient that optionally skips SSL certificate validation.
 * Only use insecure mode for local development (e.g. behind a corporate proxy).
 */
final class InsecureSslHelper {

    private InsecureSslHelper() {}

    static HttpClient buildHttpClient(boolean insecureSsl) {
        HttpClient.Builder builder = HttpClient.newBuilder();
        if (insecureSsl) {
            try {
                SSLContext sslContext = SSLContext.getInstance("TLS");
                sslContext.init(null, new TrustManager[]{new X509TrustManager() {
                    @Override public void checkClientTrusted(X509Certificate[] chain, String authType) {}
                    @Override public void checkServerTrusted(X509Certificate[] chain, String authType) {}
                    @Override public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
                }}, new SecureRandom());
                builder.sslContext(sslContext);
            } catch (Exception e) {
                throw new RuntimeException("שגיאה ביצירת חיבור SSL", e);
            }
        }
        return builder.build();
    }
}
