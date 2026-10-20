package com.english.server.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "ErrorEntry")
public class ErrorEntryEntity extends BaseEntity {
    @Column(name = "visitorId", nullable = false)
    private String visitorId;

    private String error;
    private String message;
    private String stack;
    private String url;
}
