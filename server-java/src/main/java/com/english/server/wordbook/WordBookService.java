package com.english.server.wordbook;

import com.english.server.common.ApiResult;
import com.english.server.domain.WordBookEntity;
import com.english.server.repository.WordBookRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WordBookService {
    private static final List<String> TAGS =
            List.of("gk", "zk", "gre", "toefl", "ielts", "cet6", "cet4", "ky");

    private final WordBookRepository wordBookRepository;

    public ApiResult<?> findAll(Map<String, String> query) {
        int page = parsePositive(query.get("page"), 1);
        int pageSize = parsePositive(query.get("pageSize"), 12);
        Specification<WordBookEntity> specification = (root, criteriaQuery, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            String word = query.get("word");
            if (word != null && !word.isBlank()) {
                predicates.add(builder.like(root.get("word"), "%" + word + "%"));
            }
            TAGS.forEach(tag -> {
                if ("true".equals(query.get(tag))) {
                    predicates.add(builder.isTrue(root.get(tag)));
                }
            });
            return builder.and(predicates.toArray(Predicate[]::new));
        };
        var pageable = PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "frq"));
        var resultPage = wordBookRepository.findAll(specification, pageable);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", resultPage.getTotalElements());
        result.put("list", resultPage.getContent());
        return ApiResult.success(result);
    }

    private int parsePositive(String value, int fallback) {
        try {
            return Math.max(Integer.parseInt(value), 1);
        } catch (Exception exception) {
            return fallback;
        }
    }
}
