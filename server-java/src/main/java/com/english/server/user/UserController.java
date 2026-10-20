package com.english.server.user;

import com.english.server.auth.AuthInterceptor;
import com.english.server.auth.AuthUser;
import com.english.server.auth.RequireAuth;
import com.english.server.common.ApiResult;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final MinioStorageService storageService;

    @PostMapping("/login")
    public ApiResult<?> login(@Valid @RequestBody UserContracts.Login request) {
        return userService.login(request);
    }

    @PostMapping("/register")
    public ApiResult<?> register(@Valid @RequestBody UserContracts.Register request) {
        return userService.register(request);
    }

    @PostMapping("/refresh-token")
    public ApiResult<?> refresh(@Valid @RequestBody UserContracts.Refresh request) {
        return userService.refresh(request);
    }

    @PostMapping("/upload-avatar")
    public ApiResult<?> upload(@RequestParam(value = "file", required = false) MultipartFile file)
            throws Exception {
        if (file == null || file.isEmpty()) {
            return ApiResult.error("文件不存在");
        }
        if (file.getSize() > 5L * 1024 * 1024) {
            return ApiResult.error("文件大小不能超过5MB");
        }
        return ApiResult.success(storageService.upload(file));
    }

    @RequireAuth
    @PostMapping("/update-user")
    public ApiResult<?> update(
            @RequestBody UserContracts.Update request,
            HttpServletRequest servletRequest
    ) {
        AuthUser user = (AuthUser) servletRequest.getAttribute(AuthInterceptor.AUTH_USER_ATTRIBUTE);
        return userService.update(request, user);
    }
}
