package com.listyyy.backend;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.Map;

/**
 * Replaces the default Spring Boot Whitelabel Error Page.
 * - API requests get a clean JSON response.
 * - All other requests are forwarded to the SPA so React can render a friendly 404.
 */
@Controller
public class CustomErrorController implements ErrorController {

    @RequestMapping("/error")
    @ResponseBody
    public Object handleError(HttpServletRequest request) {
        Integer statusCode = (Integer) request.getAttribute("jakarta.servlet.error.status_code");
        int status = statusCode != null ? statusCode : 500;

        String uri = (String) request.getAttribute("jakarta.servlet.error.request_uri");
        if (uri == null) uri = request.getRequestURI();

        // API requests get a JSON error
        if (uri.startsWith("/api/") || uri.startsWith("/api")) {
            String message = status == 404 ? "הנתיב לא נמצא" : "שגיאה פנימית";
            return ResponseEntity.status(status)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("message", message, "status", status));
        }

        // Non-API requests: forward to SPA so React can show its own 404/error page
        return "forward:/index.html";
    }
}
