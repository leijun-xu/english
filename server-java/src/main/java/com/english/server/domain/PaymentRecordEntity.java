package com.english.server.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "PaymentRecord")
public class PaymentRecordEntity extends BaseEntity {
    @Column(name = "userId", nullable = false)
    private String userId;

    @Column(name = "tradeNo")
    private String tradeNo;

    @Column(name = "outTradeNo", nullable = false)
    private String outTradeNo;

    private BigDecimal amount;
    private String subject;
    private String body;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "tradeStatus", columnDefinition = "\"TradeStatus\"")
    private TradeStatus tradeStatus = TradeStatus.NOT_PAY;

    @Column(name = "sendPayTime")
    private Instant sendPayTime;
}
