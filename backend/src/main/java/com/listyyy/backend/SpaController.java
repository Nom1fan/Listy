package com.listyyy.backend;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Serves the SPA index.html for all client-side routes (e.g. /lists, /lists/{id}, /login).
 * The first pattern matches single-segment paths; the second matches multi-segment paths
 * like /lists/{uuid} or /lists/{uuid}/bank.
 * API, WebSocket, upload, and static asset paths are excluded via negative lookahead.
 */
@Controller
public class SpaController {

    @GetMapping(value = {
            "/",
            "/{path:^(?!api|ws|uploads|assets)[^.]*}",
            "/{path:^(?!api|ws|uploads|assets)[^.]*}/**"
    })
    public String index() {
        return "forward:/index.html";
    }
}