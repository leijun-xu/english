package com.english.server.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "Visitor")
public class VisitorEntity extends BaseEntity {
    @Column(name = "anonymousId", nullable = false)
    private String anonymousId;

    @Column(name = "userId")
    private String userId;

    private String browser;
    private String os;
    private String device;
}
