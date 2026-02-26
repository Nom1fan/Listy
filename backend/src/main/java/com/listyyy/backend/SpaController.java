package com.listyyy.backend;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Serves the SPA index.html for all client-side routes (e.g. /lists, /lists/{id}, /login,
 * /lists/{id}/items/{id}/edit).
 * API, WebSocket, upload, and static asset paths are excluded via negative lookahead.
 */
@Controller
public class SpaController {

    @GetMapping(value = {
            "/",
            "/lists",
            "/lists/**",
            "/{path:^(?!api|ws|uploads|assets)[^.]*}",
            "/{path:^(?!api|ws|uploads|assets)[^.]*}/**"
    })
    public String index() {
        return "forward:/index.html";
    }
}