package com.english.server.pay;

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

import java.util.Map;

@RestController
@RequestMapping("/api/v1/pay")
@RequiredArgsConstructor
public class PayController {
    private final PayService payService;

    @RequireAuth
    @PostMapping("/create")
    public ApiResult<?> create(
            @Valid @RequestBody PayContracts.Create body,
            HttpServletRequest request
    ) throws Exception {
        AuthUser user = (AuthUser) request.getAttribute(AuthInterceptor.AUTH_USER_ATTRIBUTE);
        return payService.create(body, user);
    }

    @RequestMapping("/notify")
    public ApiResult<?> notify(@RequestParam Map<String, String> body) throws Exception {
        return payService.notify(body);
    }
}
