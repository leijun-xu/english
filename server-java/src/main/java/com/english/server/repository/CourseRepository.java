package com.english.server.repository;

import com.english.server.domain.CourseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CourseRepository extends JpaRepository<CourseEntity, String> {
    @Query(value = """
            SELECT c.* FROM "Course" c
            JOIN "CourseRecord" cr ON cr."courseId" = c.id
            JOIN "PaymentRecord" pr ON pr.id = cr."paymentRecordId"
            WHERE cr."userId" = :userId AND pr."tradeStatus" = 'TRADE_SUCCESS'
            """, nativeQuery = true)
    List<CourseEntity> findPurchasedByUserId(@Param("userId") String userId);
}
