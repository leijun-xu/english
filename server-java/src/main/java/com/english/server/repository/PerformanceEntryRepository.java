package com.english.server.repository;

import com.english.server.domain.PerformanceEntryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PerformanceEntryRepository
        extends JpaRepository<PerformanceEntryEntity, String>, JpaSpecificationExecutor<PerformanceEntryEntity> {
}
