package com.english.server.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "User")
public class UserEntity extends BaseEntity {
    private String name;
    private String email;
    private String phone;
    private String address;
    private String password;
    private String avatar;
    private String bio;

    @Column(name = "isTimingTask", nullable = false)
    private boolean timingTask;

    @Column(name = "timingTaskTime", nullable = false)
    private String timingTaskTime = "00:00:00";

    @Column(name = "wordNumber", nullable = false)
    private int wordNumber;

    @Column(name = "dayNumber", nullable = false)
    private int dayNumber;

    @Column(name = "lastLoginAt")
    private Instant lastLoginAt;
}
