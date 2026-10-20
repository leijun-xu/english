package com.english.server.repository;

import com.english.server.domain.PaymentRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRecordRepository extends JpaRepository<PaymentRecordEntity, String> {
    Optional<PaymentRecordEntity> findByOutTradeNo(String outTradeNo);
}
