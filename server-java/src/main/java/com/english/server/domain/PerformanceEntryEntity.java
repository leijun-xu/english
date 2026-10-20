package com.english.server.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "PerformanceEntry")
public class PerformanceEntryEntity extends BaseEntity {
    @Column(name = "visitorId", nullable = false)
    private String visitorId;

    private Double fp;
    private Double fcp;
    private Double lcp;
    private Double inp;
    private Double cls;
}
