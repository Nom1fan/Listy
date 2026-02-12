package com.example.demo;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Serves the SPA index.html for client-side routes (e.g. /lists, /login).
 * API, WebSocket, and upload paths are handled by other controllers.
 */
@Controller
public class SpaController {

    @GetMapping(value = { "/", "/{path:^(?!api|ws|uploads|assets)[^.]*}" })
    public String index() {
        return "forward:/index.html";
    }
}