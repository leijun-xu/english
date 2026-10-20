package com.english.server.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "PageView")
public class PageViewEntity extends BaseEntity {
    @Column(name = "visitorId", nullable = false)
    private String visitorId;

    private String url;
    private String referrer;
    private String path;
}
