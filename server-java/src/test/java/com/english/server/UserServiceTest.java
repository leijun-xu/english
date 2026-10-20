package com.english.server;

import com.english.server.auth.JwtTokenService;
import com.english.server.repository.UserRepository;
import com.english.server.user.UserContracts;
import com.english.server.user.UserService;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserServiceTest {
    private final UserRepository users = mock(UserRepository.class);
    private final JwtTokenService tokens = mock(JwtTokenService.class);
    private final UserService service = new UserService(users, tokens);

    @Test
    void returnsNestCompatibleMessageWhenPhoneDoesNotExist() {
        when(users.findByPhone("13800000000")).thenReturn(Optional.empty());

        var result = service.login(new UserContracts.Login("13800000000", "password"));

        assertThat(result.code()).isEqualTo(500);
        assertThat(result.message()).isEqualTo("手机号不存在");
        assertThat(result.data()).isNull();
    }
}
