package com.english.server.learn;

import com.english.server.common.ApiResult;
import com.english.server.domain.CourseEntity;
import com.english.server.domain.WordBookRecordEntity;
import com.english.server.repository.CourseRecordRepository;
import com.english.server.repository.CourseRepository;
import com.english.server.repository.UserRepository;
import com.english.server.repository.WordBookRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class LearnService {
    private static final Set<String> COURSE_TYPES =
            Set.of("gk", "zk", "gre", "toefl", "ielts", "cet6", "cet4", "ky");

    private final CourseRecordRepository courseRecordRepository;
    private final CourseRepository courseRepository;
    private final WordBookRecordRepository wordBookRecordRepository;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    public ApiResult<?> words(String courseId, String userId) {
        var record = courseRecordRepository
                .findFirstByUserIdAndCourseIdAndPurchasedTrue(userId, courseId)
                .orElse(null);
        if (record == null) {
            return ApiResult.error("非法请求");
        }
        CourseEntity course = courseRepository.findById(record.getCourseId()).orElseThrow();
        if (!COURSE_TYPES.contains(course.getValue())) {
            return ApiResult.error("非法请求");
        }
        String sql = """
                SELECT w.* FROM "WordBook" w
                WHERE w."%s" = true
                  AND NOT EXISTS (
                    SELECT 1 FROM "WordBookRecord" r
                    WHERE r."wordId" = w.id AND r."userId" = ?
                  )
                ORDER BY w.frq DESC
                LIMIT 10
                """.formatted(course.getValue());
        return ApiResult.success(jdbcTemplate.query(sql, this::mapWord, userId));
    }

    @Transactional
    public ApiResult<?> master(List<String> wordIds, String userId) {
        List<WordBookRecordEntity> records = wordIds.stream().map(wordId -> {
            WordBookRecordEntity record = new WordBookRecordEntity();
            record.setWordId(wordId);
            record.setUserId(userId);
            record.setMaster(true);
            return record;
        }).toList();
        wordBookRecordRepository.saveAll(records);
        var user = userRepository.findById(userId).orElseThrow();
        user.setWordNumber(user.getWordNumber() + wordIds.size());
        userRepository.save(user);
        return ApiResult.success(Map.of("wordNumber", user.getWordNumber()));
    }

    private Map<String, Object> mapWord(ResultSet resultSet, int row) throws SQLException {
        Map<String, Object> word = new LinkedHashMap<>();
        for (String column : List.of(
                "id", "word", "phonetic", "definition", "translation", "pos", "collins",
                "oxford", "tag", "bnc", "frq", "exchange", "gk", "zk", "gre", "toefl",
                "ielts", "cet6", "cet4", "ky"
        )) {
            word.put(column, resultSet.getObject(column));
        }
        word.put("createdAt", resultSet.getTimestamp("createdAt").toInstant());
        word.put("updatedAt", resultSet.getTimestamp("updatedAt").toInstant());
        return word;
    }
}
