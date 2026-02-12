package com.example.demo.notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FcmTokenRepository extends JpaRepository<FcmToken, UUID> {

    List<FcmToken> findByUserId(UUID userId);
}
