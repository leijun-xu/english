package com.english.server.pay;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public final class PayContracts {
    private PayContracts() {
    }

    public record Create(
            @NotBlank String subject,
            String body,
            @NotBlank @JsonProperty("total_amount") String totalAmount,
            @NotBlank String courseId
    ) {
    }
}
