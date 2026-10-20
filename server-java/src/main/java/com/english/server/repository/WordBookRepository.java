package com.english.server.repository;

import com.english.server.domain.WordBookEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface WordBookRepository
        extends JpaRepository<WordBookEntity, String>, JpaSpecificationExecutor<WordBookEntity> {
}
