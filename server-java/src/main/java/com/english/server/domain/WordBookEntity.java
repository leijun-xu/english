package com.english.server.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "WordBook")
public class WordBookEntity extends BaseEntity {
    private String word;
    private String phonetic;
    private String definition;
    private String translation;
    private String pos;
    private String collins;
    private String oxford;
    private String tag;
    private String bnc;
    private String frq;
    private String exchange;
    private Boolean gk;
    private Boolean zk;
    private Boolean gre;
    private Boolean toefl;
    private Boolean ielts;
    private Boolean cet6;
    private Boolean cet4;
    private Boolean ky;
}
