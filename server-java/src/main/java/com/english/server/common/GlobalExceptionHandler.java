package com.english.server.common;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiEnvelope<Void>> unauthorized(
            UnauthorizedException exception,
            HttpServletRequest request
    ) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiEnvelope.failure(request.getRequestURI(), exception.getMessage(), 401));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiEnvelope<Void>> validation(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("请求参数错误");
        return ResponseEntity.badRequest()
                .body(ApiEnvelope.failure(request.getRequestURI(), message, 400));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ApiEnvelope<Void> uploadTooLarge(HttpServletRequest request) {
        return ApiEnvelope.of(request.getRequestURI(), ApiResult.error("文件大小不能超过5MB"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiEnvelope<Void>> unknown(Exception exception, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiEnvelope.failure(request.getRequestURI(), exception.getMessage(), 500));
    }
}
