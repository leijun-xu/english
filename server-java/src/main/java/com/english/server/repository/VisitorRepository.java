package com.english.server.repository;

import com.english.server.domain.VisitorEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface VisitorRepository
        extends JpaRepository<VisitorEntity, String>, JpaSpecificationExecutor<VisitorEntity> {
    Optional<VisitorEntity> findByAnonymousId(String anonymousId);
}
