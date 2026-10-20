package com.english.server.user;

import jakarta.validation.constraints.NotBlank;

public final class UserContracts {
    private UserContracts() {
    }

    public record Login(@NotBlank String phone, @NotBlank String password) {
    }

    public record Register(
            @NotBlank String name,
            String email,
            @NotBlank String phone,
            @NotBlank String password
    ) {
    }

    public record Refresh(@NotBlank String refreshToken) {
    }

    public record Update(
            String name,
            String email,
            String address,
            String avatar,
            String bio,
            Boolean isTimingTask,
            String timingTaskTime
    ) {
    }
}
