package com.english.server.repository;

import com.english.server.domain.WordBookRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WordBookRecordRepository extends JpaRepository<WordBookRecordEntity, String> {
}
