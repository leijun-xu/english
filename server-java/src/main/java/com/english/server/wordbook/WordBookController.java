package com.english.server.wordbook;

import com.english.server.common.ApiResult;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/word-book")
@RequiredArgsConstructor
public class WordBookController {
    private final WordBookService wordBookService;

    @GetMapping
    public ApiResult<?> findAll(@RequestParam Map<String, String> query) {
        return wordBookService.findAll(query);
    }
}
