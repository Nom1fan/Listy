package com.listyyy.backend;

import com.listyyy.backend.auth.EmailOtp;
import com.listyyy.backend.auth.PhoneOtp;
import com.listyyy.backend.auth.PhoneOtpRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
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
    void phone_verify_updates_displayName_for_existing_user() throws Exception {
        String phone = "+972501234571";
        userRepository.save(com.listyyy.backend.auth.User.builder()
                .phone(phone)
                .displayName("Old Name")
                .locale("he")
                .build());

        String code = "111111";
        phoneOtpRepository.save(PhoneOtp.builder()
                .phone(phone)
                .code(code)
                .expiresAt(Instant.now().plusSeconds(3600))
                .build());

        mvc.perform(post("/api/auth/phone/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("phone", phone, "code", code, "displayName", "New Name"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("New Name"));
    }

    // ---- Email OTP tests ----

    @Test
    void email_request_otp_returns_204() throws Exception {
        mvc.perform(post("/api/auth/email/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "otp@example.com"))))
                .andExpect(status().isNoContent());
    }

    @Test
    void email_verify_succeeds_with_valid_otp_and_displayName() throws Exception {
        String email = "newuser@example.com";
        String code = "123456";
        emailOtpRepository.save(EmailOtp.builder()
                .email(email)
                .code(code)
                .expiresAt(Instant.now().plusSeconds(3600))
                .build());

        mvc.perform(post("/api/auth/email/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "code", code, "displayName", "New Email User"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.displayName").value("New Email User"));
    }

    @Test
    void email_verify_updates_displayName_for_existing_user() throws Exception {
        String email = "updatename@example.com";
        userRepository.save(com.listyyy.backend.auth.User.builder()
                .email(email)
                .displayName("Old Email Name")
                .locale("he")
                .build());

        String code = "222222";
        emailOtpRepository.save(EmailOtp.builder()
                .email(email)
                .code(code)
                .expiresAt(Instant.now().plusSeconds(3600))
                .build());

        mvc.perform(post("/api/auth/email/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "code", code, "displayName", "New Email Name"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("New Email Name"));
    }

    @Test
    void email_verify_succeeds_without_displayName_for_existing_user() throws Exception {
        String email = "existing@example.com";
        userRepository.save(com.listyyy.backend.auth.User.builder()
                .email(email)
                .displayName("Existing Email User")
                .locale("he")
                .build());

        String code = "654321";
        emailOtpRepository.save(EmailOtp.builder()
                .email(email)
                .code(code)
                .expiresAt(Instant.now().plusSeconds(3600))
                .build());

        mvc.perform(post("/api/auth/email/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "code", code))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.displayName").value("Existing Email User"));
    }

    @Test
    void email_verify_fails_with_invalid_code() throws Exception {
        String email = "bad@example.com";
        emailOtpRepository.save(EmailOtp.builder()
                .email(email)
                .code("123456")
                .expiresAt(Instant.now().plusSeconds(3600))
                .build());

        mvc.perform(post("/api/auth/email/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "code", "000000"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void email_verify_fails_with_expired_code() throws Exception {
        String email = "expired@example.com";
        emailOtpRepository.save(EmailOtp.builder()
                .email(email)
                .code("123456")
                .expiresAt(Instant.now().minusSeconds(60))
                .build());

        mvc.perform(post("/api/auth/email/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "code", "123456"))))
                .andExpect(status().isBadRequest());
    }

    // ---- SMS/Email send failure tests ----

    @Test
    void phone_request_otp_returns_error_when_sms_fails() throws Exception {
        doThrow(new IllegalArgumentException("שליחת SMS נכשלה. נסה שוב מאוחר יותר."))
                .when(smsService).sendOtp(anyString(), anyString());

        mvc.perform(post("/api/auth/phone/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("phone", "+972501234567"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("שליחת SMS נכשלה. נסה שוב מאוחר יותר."));
    }

    @Test
    void phone_request_otp_returns_error_when_sms_not_configured() throws Exception {
        doThrow(new IllegalArgumentException("שליחת SMS לא מוגדרת. נסה להתחבר עם אימייל."))
                .when(smsService).sendOtp(anyString(), anyString());

        mvc.perform(post("/api/auth/phone/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("phone", "+972501234567"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("שליחת SMS לא מוגדרת. נסה להתחבר עם אימייל."));
    }

    @Test
    void email_request_otp_returns_error_when_email_fails() throws Exception {
        doThrow(new IllegalArgumentException("שליחת אימייל נכשלה. נסה שוב מאוחר יותר."))
                .when(emailService).sendOtp(anyString(), anyString());

        mvc.perform(post("/api/auth/email/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "fail@example.com"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("שליחת אימייל נכשלה. נסה שוב מאוחר יותר."));
    }

    @Test
    void email_request_otp_returns_error_when_email_not_configured() throws Exception {
        doThrow(new IllegalArgumentException("שליחת אימייל לא מוגדרת. נסה להתחבר עם טלפון."))
                .when(emailService).sendOtp(anyString(), anyString());

        mvc.perform(post("/api/auth/email/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "noconfig@example.com"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("שליחת אימייל לא מוגדרת. נסה להתחבר עם טלפון."));
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

    // ---- Profile image tests ----

    @Test
    void update_profile_sets_profile_image_url() throws Exception {
        mvc.perform(patch("/api/auth/me")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "displayName", "Test User",
                                "profileImageUrl", "https://example.com/photo.jpg"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileImageUrl").value("https://example.com/photo.jpg"))
                .andExpect(jsonPath("$.displayName").value("Test User"));
    }

    @Test
    void update_profile_clears_profile_image_url() throws Exception {
        // First set it
        mvc.perform(patch("/api/auth/me")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "displayName", "Test User",
                                "profileImageUrl", "https://example.com/photo.jpg"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileImageUrl").value("https://example.com/photo.jpg"));

        // Then clear it with empty string
        mvc.perform(patch("/api/auth/me")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "displayName", "Test User",
                                "profileImageUrl", ""))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileImageUrl").doesNotExist());
    }

    @Test
    void update_profile_image_only_keeps_existing_display_name() throws Exception {
        mvc.perform(patch("/api/auth/me")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "profileImageUrl", "https://example.com/avatar.png"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Test User"))
                .andExpect(jsonPath("$.profileImageUrl").value("https://example.com/avatar.png"));
    }

    @Test
    void login_response_includes_profile_image_url() throws Exception {
        // Set a profile image first
        testUser.setProfileImageUrl("https://example.com/me.jpg");
        userRepository.save(testUser);

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "test@example.com", "password", "password123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileImageUrl").value("https://example.com/me.jpg"));
    }

    @Test
    void login_response_has_null_profile_image_url_when_not_set() throws Exception {
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "test@example.com", "password", "password123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profileImageUrl").doesNotExist());
    }

    @Test
    void upload_profile_image() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "avatar.png", "image/png", new byte[]{1, 2, 3, 4});

        mvc.perform(multipart("/api/upload/profile")
                        .file(file)
                        .header("Authorization", getBearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").exists());
    }

    @Test
    void upload_profile_image_requires_auth() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "avatar.png", "image/png", new byte[]{1, 2, 3, 4});

        mvc.perform(multipart("/api/upload/profile").file(file))
                .andExpect(status().is4xxClientError());
    }

    // ---- Phone/email linking tests ----

    @Test
    void update_profile_links_phone_to_email_user() throws Exception {
        mvc.perform(patch("/api/auth/me")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("phone", "+972541234567"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phone").value("+972541234567"))
                .andExpect(jsonPath("$.email").value("test@example.com"));
    }

    @Test
    void update_profile_links_email_to_phone_user() throws Exception {
        com.listyyy.backend.auth.User phoneUser = com.listyyy.backend.auth.User.builder()
                .phone("+972509876543")
                .displayName("Phone User")
                .locale("he")
                .build();
        phoneUser = userRepository.save(phoneUser);
        var ws = workspaceRepository.save(com.listyyy.backend.workspace.Workspace.builder().name("ws").build());
        workspaceMemberRepository.save(com.listyyy.backend.workspace.WorkspaceMember.builder()
                .workspaceId(ws.getId()).userId(phoneUser.getId()).workspace(ws).user(phoneUser).role("owner").build());

        String phoneCode = "111222";
        phoneOtpRepository.save(PhoneOtp.builder()
                .phone("+972509876543").code(phoneCode)
                .expiresAt(Instant.now().plusSeconds(3600)).build());
        String body = mvc.perform(post("/api/auth/phone/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "phone", "+972509876543", "code", phoneCode))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String phoneToken = objectMapper.readTree(body).get("token").asText();

        mvc.perform(patch("/api/auth/me")
                        .header("Authorization", "Bearer " + phoneToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "linked@example.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("linked@example.com"))
                .andExpect(jsonPath("$.phone").value("+972509876543"));
    }

    @Test
    void update_profile_rejects_phone_already_taken() throws Exception {
        userRepository.save(com.listyyy.backend.auth.User.builder()
                .phone("+972507777777").displayName("Other").locale("he").build());

        mvc.perform(patch("/api/auth/me")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("phone", "+972507777777"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void update_profile_rejects_email_already_taken() throws Exception {
        userRepository.save(com.listyyy.backend.auth.User.builder()
                .email("taken@example.com").displayName("Other").locale("he").build());

        mvc.perform(patch("/api/auth/me")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "taken@example.com"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void phone_login_finds_user_after_phone_linked_to_email_account() throws Exception {
        mvc.perform(patch("/api/auth/me")
                        .header("Authorization", getBearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("phone", "+972545555555"))))
                .andExpect(status().isOk());

        String code = "789012";
        phoneOtpRepository.save(PhoneOtp.builder()
                .phone("+972545555555").code(code)
                .expiresAt(Instant.now().plusSeconds(3600)).build());

        mvc.perform(post("/api/auth/phone/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "phone", "+972545555555", "code", code, "displayName", "ignored"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(testUser.getId().toString()))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.phone").value("+972545555555"));
    }
}
