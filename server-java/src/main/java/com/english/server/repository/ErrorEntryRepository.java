package com.english.server.repository;

import com.english.server.domain.ErrorEntryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ErrorEntryRepository
        extends JpaRepository<ErrorEntryEntity, String>, JpaSpecificationExecutor<ErrorEntryEntity> {
}
