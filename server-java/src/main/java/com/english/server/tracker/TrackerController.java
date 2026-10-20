package com.english.server.tracker;

import com.english.server.auth.RequireAuth;
import com.english.server.common.ApiResult;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/tracker")
@RequiredArgsConstructor
public class TrackerController {
    private final TrackerService trackerService;

    @PostMapping("/uv")
    public ApiResult<?> uv(@RequestBody TrackerContracts.Uv body) {
        return trackerService.uv(body);
    }

    @PostMapping("/update-uv")
    public ApiResult<?> updateUv(@RequestBody TrackerContracts.UpdateUv body) {
        return trackerService.updateUv(body);
    }

    @PostMapping("/performance")
    public ApiResult<?> performance(@RequestBody TrackerContracts.Performance body) {
        return trackerService.performance(body);
    }

    @PostMapping("/pv")
    public ApiResult<?> pv(@RequestBody TrackerContracts.Pv body) {
        return trackerService.pv(body);
    }

    @PostMapping("/event")
    public ApiResult<?> event(@RequestBody TrackerContracts.Event body) {
        return trackerService.event(body);
    }

    @PostMapping("/error")
    public ApiResult<?> error(@RequestBody TrackerContracts.Error body) {
        return trackerService.error(body);
    }

    @RequireAuth
    @GetMapping("/analytics")
    public ApiResult<?> analytics(@RequestParam Map<String, String> query) {
        return trackerService.analytics(query);
    }

    @RequireAuth
    @GetMapping("/visitors")
    public ApiResult<?> visitors(@RequestParam Map<String, String> query) {
        return trackerService.visitors(query);
    }

    @RequireAuth
    @GetMapping("/page-views")
    public ApiResult<?> pageViews(@RequestParam Map<String, String> query) {
        return trackerService.pageViews(query);
    }

    @RequireAuth
    @GetMapping("/events")
    public ApiResult<?> events(@RequestParam Map<String, String> query) {
        return trackerService.events(query);
    }

    @RequireAuth
    @GetMapping("/performance")
    public ApiResult<?> performanceList(@RequestParam Map<String, String> query) {
        return trackerService.performanceList(query);
    }

    @RequireAuth
    @GetMapping("/errors")
    public ApiResult<?> errors(@RequestParam Map<String, String> query) {
        return trackerService.errors(query);
    }
}
