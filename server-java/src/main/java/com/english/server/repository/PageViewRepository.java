package com.english.server.repository;

import com.english.server.domain.PageViewEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PageViewRepository
        extends JpaRepository<PageViewEntity, String>, JpaSpecificationExecutor<PageViewEntity> {
}
