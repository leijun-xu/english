package com.english.server.common;

import java.time.Instant;

public record ApiEnvelope<T>(
        Instant timestamp,
        String path,
        String message,
        int code,
        boolean success,
        T data
) {
    public static <T> ApiEnvelope<T> of(String path, ApiResult<T> result) {
        return new ApiEnvelope<>(Instant.now(), path, result.message(), result.code(), true, result.data());
    }

    public static ApiEnvelope<Void> failure(String path, String message, int code) {
        return new ApiEnvelope<>(Instant.now(), path, message, code, false, null);
    }
}
