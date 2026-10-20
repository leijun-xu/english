package com.english.server.common;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class RootController {
    @GetMapping
    public ApiResult<Void> hello() {
        return ApiResult.success(null);
    }
}
