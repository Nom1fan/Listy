package com.listyyy.backend.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.from:noreply@listyyy.app}")
    private String mailFrom;

    public void sendOtp(String toEmail, String code) {
        if (mailUsername == null || mailUsername.isBlank()) {
            log.error("Mail not configured; cannot send OTP to {}", toEmail);
            throw new IllegalArgumentException("שליחת אימייל לא מוגדרת. נסה להתחבר עם טלפון.");
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailFrom);
            message.setTo(toEmail);
            message.setSubject("Listyyy - קוד אימות");
            message.setText("הקוד שלך הוא: " + code + "\n\nהקוד תקף ל-5 דקות.");
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send email to {}", toEmail, e);
            throw new IllegalArgumentException("שליחת אימייל נכשלה. נסה שוב מאוחר יותר.");
        }
    }
}
