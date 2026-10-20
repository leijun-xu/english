package com.english.server.repository;

import com.english.server.domain.CourseRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CourseRecordRepository extends JpaRepository<CourseRecordEntity, String> {
    Optional<CourseRecordEntity> findFirstByUserIdAndCourseId(String userId, String courseId);

    Optional<CourseRecordEntity> findFirstByUserIdAndCourseIdAndPurchasedTrue(String userId, String courseId);
}
