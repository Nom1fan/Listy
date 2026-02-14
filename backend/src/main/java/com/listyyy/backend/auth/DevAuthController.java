package com.listyyy.backend.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.listyyy.backend.workspace.WorkspaceService;

/**
 * Development-only controller that provides instant login without OTP.
 * Only active when the "local" Spring profile is enabled.
 */
@Profile("local")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class DevAuthController {

    private static final String DEV_PHONE = "+972500000000";
    private static final String DEV_DISPLAY_NAME = "Dev User";

    private final AuthService authService;
    private final UserRepository userRepository;
    private final WorkspaceService workspaceService;
    private final JwtProperties jwtProperties;

    @PostMapping("/dev-login")
    public ResponseEntity<AuthResponse> devLogin(HttpServletResponse response) {
        User user = userRepository.findByPhone(DEV_PHONE).orElseGet(() -> {
            User newUser = User.builder()
                    .phone(DEV_PHONE)
                    .displayName(DEV_DISPLAY_NAME)
                    .locale("he")
                    .build();
            newUser = userRepository.save(newUser);
            workspaceService.createDefaultWorkspace(newUser);
            return newUser;
        });

        LoginResult result = authService.buildLoginResult(user);
        setRefreshCookie(response, result.refreshToken());
        return ResponseEntity.ok(result.authResponse());
    }

    private void setRefreshCookie(HttpServletResponse response, String refreshToken) {
        Cookie cookie = new Cookie(jwtProperties.getRefreshCookieName(), refreshToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(jwtProperties.isRefreshCookieSecure());
        cookie.setPath("/api/auth");
        cookie.setMaxAge((int) (jwtProperties.getRefreshExpirationMs() / 1000));
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);
    }
}
