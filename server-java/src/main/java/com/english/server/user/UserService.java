package com.english.server.user;

import com.english.server.auth.AuthUser;
import com.english.server.auth.JwtTokenService;
import com.english.server.common.ApiResult;
import com.english.server.domain.UserEntity;
import com.english.server.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final JwtTokenService jwtTokenService;

    @Transactional
    public ApiResult<?> login(UserContracts.Login request) {
        UserEntity user = userRepository.findByPhone(request.phone()).orElse(null);
        if (user == null) {
            return ApiResult.error("手机号不存在");
        }
        if (!user.getPassword().equals(request.password())) {
            return ApiResult.error("密码不正确");
        }
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);
        return ApiResult.success(withToken(user));
    }

    @Transactional
    public ApiResult<?> register(UserContracts.Register request) {
        if (userRepository.findByPhone(request.phone()).isPresent()) {
            return ApiResult.error("手机号已经存在");
        }
        if (request.email() != null && !request.email().isBlank() &&
                userRepository.findByEmail(request.email()).isPresent()) {
            return ApiResult.error("邮箱已经存在");
        }
        UserEntity user = new UserEntity();
        user.setName(request.name());
        user.setPhone(request.phone());
        user.setPassword(request.password());
        user.setEmail(request.email() == null || request.email().isBlank() ? null : request.email());
        user.setLastLoginAt(Instant.now());
        return ApiResult.success(withToken(userRepository.save(user)));
    }

    public ApiResult<?> refresh(UserContracts.Refresh request) {
        try {
            AuthUser tokenUser = jwtTokenService.verify(request.refreshToken());
            if (!"refresh".equals(tokenUser.tokenType())) {
                return ApiResult.error("refreshToken已过期或无效");
            }
            UserEntity user = userRepository.findById(tokenUser.userId()).orElse(null);
            if (user == null) {
                return ApiResult.error("用户不存在");
            }
            return ApiResult.success(jwtTokenService.generate(toAuthUser(user)));
        } catch (Exception exception) {
            return ApiResult.error("refreshToken已过期或无效");
        }
    }

    @Transactional
    public ApiResult<?> update(UserContracts.Update request, AuthUser authUser) {
        UserEntity user = userRepository.findById(authUser.userId()).orElseThrow();
        if (request.name() != null) user.setName(request.name());
        if (request.email() != null) user.setEmail(request.email());
        if (request.address() != null) user.setAddress(request.address());
        if (request.avatar() != null) user.setAvatar(request.avatar());
        if (request.bio() != null) user.setBio(request.bio());
        if (request.isTimingTask() != null) user.setTimingTask(request.isTimingTask());
        if (request.timingTaskTime() != null) user.setTimingTaskTime(request.timingTaskTime());
        userRepository.save(user);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("name", user.getName());
        result.put("email", user.getEmail());
        result.put("address", user.getAddress());
        result.put("avatar", user.getAvatar());
        result.put("bio", user.getBio());
        result.put("isTimingTask", user.isTimingTask());
        result.put("timingTaskTime", user.getTimingTaskTime());
        return ApiResult.success(result);
    }

    private Map<String, Object> withToken(UserEntity user) {
        Map<String, Object> result = selectedUser(user);
        result.put("token", jwtTokenService.generate(toAuthUser(user)));
        return result;
    }

    private Map<String, Object> selectedUser(UserEntity user) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", user.getId());
        result.put("name", user.getName());
        result.put("email", user.getEmail());
        result.put("phone", user.getPhone());
        result.put("address", user.getAddress());
        result.put("avatar", user.getAvatar());
        result.put("createdAt", user.getCreatedAt());
        result.put("updatedAt", user.getUpdatedAt());
        result.put("lastLoginAt", user.getLastLoginAt());
        result.put("wordNumber", user.getWordNumber());
        result.put("dayNumber", user.getDayNumber());
        result.put("bio", user.getBio());
        result.put("isTimingTask", user.isTimingTask());
        result.put("timingTaskTime", user.getTimingTaskTime());
        return result;
    }

    private AuthUser toAuthUser(UserEntity user) {
        return new AuthUser(user.getId(), user.getName(), user.getEmail(), null);
    }
}
