package com.english.server.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "Course")
public class CourseEntity extends BaseEntity {
    private String name;
    private String value;
    private String description;
    private String teacher;
    private String url;
    private BigDecimal price;
}
