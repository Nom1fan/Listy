package com.listyyy.backend.auth;

/**
 * Bundles the JSON body (AuthResponse) with the opaque refresh token
 * that the controller will set as an HttpOnly cookie.
 */
public record LoginResult(AuthResponse authResponse, String refreshToken) {
}
