package com.english.server.course;

import com.english.server.common.ApiResult;
import com.english.server.domain.CourseEntity;
import com.english.server.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CourseService {
    private final CourseRepository courseRepository;

    public ApiResult<?> findAll() {
        return ApiResult.success(courseRepository.findAll().stream().map(this::toResult).toList());
    }

    public ApiResult<?> findMine(String userId) {
        return ApiResult.success(courseRepository.findPurchasedByUserId(userId)
                .stream().map(this::toResult).toList());
    }

    private Map<String, Object> toResult(CourseEntity course) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", course.getId());
        result.put("name", course.getName());
        result.put("value", course.getValue());
        result.put("description", course.getDescription());
        result.put("teacher", course.getTeacher());
        result.put("url", course.getUrl());
        result.put("price", course.getPrice().setScale(2, RoundingMode.HALF_UP).toPlainString());
        result.put("createdAt", course.getCreatedAt());
        result.put("updatedAt", course.getUpdatedAt());
        return result;
    }
}
