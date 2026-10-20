package com.english.server.auth;

public record AuthUser(String userId, String name, String email, String tokenType) {
}
