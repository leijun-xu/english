package com.english.server.auth;

import com.english.server.common.UnauthorizedException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {
    public static final String AUTH_USER_ATTRIBUTE = AuthInterceptor.class.getName() + ".user";

    private final JwtTokenService jwtTokenService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod method) ||
                (!method.hasMethodAnnotation(RequireAuth.class) &&
                        !method.getBeanType().isAnnotationPresent(RequireAuth.class))) {
            return true;
        }
        String authorization = request.getHeader("Authorization");
        if (authorization == null || authorization.isBlank()) {
            throw new UnauthorizedException("你是偷子???");
        }
        try {
            String token = authorization.startsWith("Bearer ")
                    ? authorization.substring(7)
                    : authorization.split(" ")[1];
            AuthUser user = jwtTokenService.verify(token);
            if (!"access".equals(user.tokenType())) {
                throw new UnauthorizedException("token已过期或无效");
            }
            request.setAttribute(AUTH_USER_ATTRIBUTE, user);
            return true;
        } catch (UnauthorizedException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new UnauthorizedException("token已过期或无效");
        }
    }
}
