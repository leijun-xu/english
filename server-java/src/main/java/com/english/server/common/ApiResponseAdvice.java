package com.english.server.common;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

@ControllerAdvice
@RequiredArgsConstructor
public class ApiResponseAdvice implements ResponseBodyAdvice<Object> {
    private final HttpServletRequest request;

    @Override
    public boolean supports(MethodParameter returnType, Class converterType) {
        return true;
    }

    @Override
    public Object beforeBodyWrite(
            Object body,
            MethodParameter returnType,
            MediaType selectedContentType,
            Class selectedConverterType,
            ServerHttpRequest serverRequest,
            ServerHttpResponse serverResponse
    ) {
        if (body instanceof ApiEnvelope<?>) {
            return body;
        }
        if (body instanceof ApiResult<?> result) {
            return ApiEnvelope.of(request.getRequestURI(), result);
        }
        return ApiEnvelope.of(request.getRequestURI(), new ApiResult<>(null, 200, "请求成功"));
    }
}
