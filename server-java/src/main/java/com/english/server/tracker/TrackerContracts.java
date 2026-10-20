package com.english.server.tracker;

import java.util.Map;

public final class TrackerContracts {
    private TrackerContracts() {
    }

    public record Uv(String anonymousId, String userId, String browser, String os, String device) {
    }

    public record UpdateUv(String visitorId, String userId) {
    }

    public record Performance(String visitorId, Double fp, Double fcp, Double lcp, Double inp, Double cls) {
    }

    public record Pv(String visitorId, String url, String referrer, String path) {
    }

    public record Event(String visitorId, String event, Map<String, Object> payload, String url) {
    }

    public record Error(String visitorId, String error, String message, String stack, String url) {
    }
}
