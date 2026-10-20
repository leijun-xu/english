package com.english.server.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "CourseRecord")
public class CourseRecordEntity extends BaseEntity {
    @Column(name = "userId", nullable = false)
    private String userId;

    @Column(name = "courseId", nullable = false)
    private String courseId;

    @Column(name = "isPurchased", nullable = false)
    private boolean purchased;

    @Column(name = "paymentRecordId")
    private String paymentRecordId;
}
