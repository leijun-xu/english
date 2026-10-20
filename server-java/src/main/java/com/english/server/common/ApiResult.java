package com.english.server.common;

public record ApiResult<T>(T data, int code, String message) {
    public static <T> ApiResult<T> success(T data) {
        return new ApiResult<>(data, 200, "success");
    }

    public static <T> ApiResult<T> error(String message) {
        return new ApiResult<>(null, 500, message);
    }
}
