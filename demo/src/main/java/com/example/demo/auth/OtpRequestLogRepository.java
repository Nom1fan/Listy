package com.example.demo.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface OtpRequestLogRepository extends JpaRepository<OtpRequestLog, Long> {

    @Query("SELECT COUNT(o) FROM OtpRequestLog o WHERE o.phone = :phone AND o.requestedAt >= :since")
    long countByPhoneSince(@Param("phone") String phone, @Param("since") Instant since);

    @Query("SELECT COUNT(o) FROM OtpRequestLog o WHERE o.email = :email AND o.requestedAt >= :since")
    long countByEmailSince(@Param("email") String email, @Param("since") Instant since);
}
