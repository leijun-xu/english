package com.english.server.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "WordBookRecord")
public class WordBookRecordEntity extends BaseEntity {
    @Column(name = "wordId", nullable = false)
    private String wordId;

    @Column(name = "userId", nullable = false)
    private String userId;

    @Column(name = "isMaster", nullable = false)
    private boolean master;
}
