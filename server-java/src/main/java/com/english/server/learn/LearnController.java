package com.english.server.learn;

import com.english.server.auth.AuthInterceptor;
import com.english.server.auth.AuthUser;
import com.english.server.auth.RequireAuth;
import com.english.server.common.ApiResult;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/learn")
@RequireAuth
@RequiredArgsConstructor
public class LearnController {
    private final LearnService learnService;

    @GetMapping("/word/{id}")
    public ApiResult<?> words(@PathVariable String id, HttpServletRequest request) {
        return learnService.words(id, authUser(request).userId());
    }

    @PostMapping("/word/master")
    public ApiResult<?> master(@RequestBody MasterRequest body, HttpServletRequest request) {
        return learnService.master(body.wordIds(), authUser(request).userId());
    }

    private AuthUser authUser(HttpServletRequest request) {
        return (AuthUser) request.getAttribute(AuthInterceptor.AUTH_USER_ATTRIBUTE);
    }

    public record MasterRequest(List<String> wordIds) {
    }
}
