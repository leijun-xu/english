package com.english.server.course;

import com.english.server.auth.AuthInterceptor;
import com.english.server.auth.AuthUser;
import com.english.server.auth.RequireAuth;
import com.english.server.common.ApiResult;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/course")
@RequiredArgsConstructor
public class CourseController {
    private final CourseService courseService;

    @GetMapping("/list")
    public ApiResult<?> findAll() {
        return courseService.findAll();
    }

    @RequireAuth
    @GetMapping("/my")
    public ApiResult<?> findMine(HttpServletRequest request) {
        AuthUser user = (AuthUser) request.getAttribute(AuthInterceptor.AUTH_USER_ATTRIBUTE);
        return courseService.findMine(user.userId());
    }
}
