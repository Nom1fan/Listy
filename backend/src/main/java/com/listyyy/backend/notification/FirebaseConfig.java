package com.listyyy.backend.notification;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;

@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${GOOGLE_APPLICATION_CREDENTIALS:}")
    private String credentialsPath;

    @PostConstruct
    public void init() {
        if (FirebaseApp.getApps().isEmpty()) {
            try {
                FirebaseOptions.Builder builder = FirebaseOptions.builder();
                if (credentialsPath != null && !credentialsPath.isBlank()) {
                    builder.setCredentials(GoogleCredentials.fromStream(new FileInputStream(credentialsPath)));
                } else {
                    builder.setCredentials(GoogleCredentials.getApplicationDefault());
                }
                FirebaseApp.initializeApp(builder.build());
                log.info("Firebase Admin SDK initialized");
            } catch (IOException e) {
                log.warn("Firebase Admin SDK not initialized — push notifications disabled: {}", e.getMessage());
            }
        }
    }
}
