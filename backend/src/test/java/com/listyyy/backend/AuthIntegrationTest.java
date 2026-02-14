package com.listyyy.backend;

import com.listyyy.backend.auth.PhoneOtp;
import com.listyyy.backend.auth.PhoneOtpRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthIntegrationTest extends AbstractIntegrationTest {

    @Test
    void register_and_login() throws Exception {
        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "new@example.com",
                                "password", "secret123",
                                "displayName", "New User"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.userId").exists());

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "new@example.com", "password", "secret123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());
    }

    @Test
    void login_fails_with_wrong_password() throws Exception {
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "test@example.com", "password", "wrong"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void phone_request_otp_returns_204() throws Exception {
        mvc.perform(post("/api/auth/phone/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("phone", "+972501234567"))))
                .andExpect(status().isNoContent());
    }

    @Test
    void phone_verify_succeeds_with_valid_otp_and_displayName() throws Exception {
        String phone = "+972501234568";
        String code = "123456";
        phoneOtpRepository.save(PhoneOtp.builder()
                .phone(phone)
                .code(code)
                .expiresAt(Instant.now().plusSeconds(3600))
                .build());

        mvc.perform(post("/api/auth/phone/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("phone", phone, "code", code, "displayName", "Moshe"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.displayName").value("Moshe"));
    }

    @Test
    void phone_verify_succeeds_without_displayName_for_existing_user() throws Exception {
        // Create user via phone first
        String phone = "+972501234570";
        userRepository.save(com.listyyy.backend.auth.User.builder()
                .phone(phone)
                .displayName("Existing User")
                .locale("he")
                .build());

        String code = "654321";
        phoneOtpRepository.save(PhoneOtp.builder()
                .phone(phone)
                .code(code)
                .expiresAt(Instant.now().plusSeconds(3600))
                .build());

        mvc.perform(post("/api/auth/phone/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("phone", phone, "code", code))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.displayName").value("Existing User"));
    }

    @Test
    void phone_verify_fails_with_invalid_code() throws Exception {
        String phone = "+972501234569";
        phoneOtpRepository.save(PhoneOtp.builder()
                .phone(phone)
                .code("123456")
                .expiresAt(Instant.now().plusSeconds(3600))
                .build());

        mvc.perform(post("/api/auth/phone/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("phone", phone, "code", "000000"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_fails_without_displayName() throws Exception {
        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "nodisplay@example.com",
                                "password", "secret123"))))
                .andExpect(status().isBadRequest());
    }
}
