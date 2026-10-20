package com.english.server.repository;

import com.english.server.domain.TrackEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface TrackEventRepository
        extends JpaRepository<TrackEventEntity, String>, JpaSpecificationExecutor<TrackEventEntity> {
}
