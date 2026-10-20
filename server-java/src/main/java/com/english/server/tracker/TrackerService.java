package com.english.server.tracker;

import com.english.server.common.ApiResult;
import com.english.server.domain.ErrorEntryEntity;
import com.english.server.domain.PageViewEntity;
import com.english.server.domain.PerformanceEntryEntity;
import com.english.server.domain.TrackEventEntity;
import com.english.server.domain.VisitorEntity;
import com.english.server.repository.ErrorEntryRepository;
import com.english.server.repository.PageViewRepository;
import com.english.server.repository.PerformanceEntryRepository;
import com.english.server.repository.TrackEventRepository;
import com.english.server.repository.VisitorRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TrackerService {
    private final VisitorRepository visitorRepository;
    private final PageViewRepository pageViewRepository;
    private final TrackEventRepository trackEventRepository;
    private final PerformanceEntryRepository performanceEntryRepository;
    private final ErrorEntryRepository errorEntryRepository;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    @Transactional
    public ApiResult<?> uv(TrackerContracts.Uv body) {
        VisitorEntity visitor = visitorRepository.findByAnonymousId(body.anonymousId())
                .orElseGet(VisitorEntity::new);
        visitor.setAnonymousId(body.anonymousId());
        visitor.setUserId(body.userId());
        visitor.setBrowser(body.browser());
        visitor.setOs(body.os());
        visitor.setDevice(body.device());
        return ApiResult.success(visitorRepository.save(visitor).getId());
    }

    @Transactional
    public ApiResult<?> updateUv(TrackerContracts.UpdateUv body) {
        VisitorEntity visitor = visitorRepository.findById(body.visitorId()).orElseThrow();
        visitor.setUserId(body.userId());
        visitorRepository.save(visitor);
        return ApiResult.success(true);
    }

    public ApiResult<?> performance(TrackerContracts.Performance body) {
        PerformanceEntryEntity entry = new PerformanceEntryEntity();
        entry.setVisitorId(body.visitorId());
        entry.setFp(body.fp());
        entry.setFcp(body.fcp());
        entry.setLcp(body.lcp());
        entry.setInp(body.inp());
        entry.setCls(body.cls());
        performanceEntryRepository.save(entry);
        return ApiResult.success(true);
    }

    public ApiResult<?> pv(TrackerContracts.Pv body) {
        PageViewEntity entry = new PageViewEntity();
        entry.setVisitorId(body.visitorId());
        entry.setUrl(body.url());
        entry.setReferrer(body.referrer());
        entry.setPath(body.path());
        pageViewRepository.save(entry);
        return ApiResult.success(true);
    }

    public ApiResult<?> event(TrackerContracts.Event body) {
        TrackEventEntity entry = new TrackEventEntity();
        entry.setVisitorId(body.visitorId());
        entry.setEvent(body.event());
        entry.setPayload(body.payload());
        entry.setUrl(body.url());
        trackEventRepository.save(entry);
        return ApiResult.success(true);
    }

    public ApiResult<?> error(TrackerContracts.Error body) {
        ErrorEntryEntity entry = new ErrorEntryEntity();
        entry.setVisitorId(body.visitorId());
        entry.setError(body.error());
        entry.setMessage(body.message());
        entry.setStack(body.stack());
        entry.setUrl(body.url());
        errorEntryRepository.save(entry);
        return ApiResult.success(true);
    }

    public ApiResult<?> analytics(Map<String, String> query) {
        DateRange range = dateRange(query);
        DateRange previous = previousRange(range);
        long visitors = scalarLong("""
                SELECT COUNT(DISTINCT "visitorId") FROM "PageView"
                WHERE "createdAt" BETWEEN ? AND ?
                """, range);
        long previousVisitors = scalarLong("""
                SELECT COUNT(DISTINCT "visitorId") FROM "PageView"
                WHERE "createdAt" BETWEEN ? AND ?
                """, previous);
        long pageViews = count("PageView", range);
        long previousPageViews = count("PageView", previous);
        long events = count("TrackEvent", range);
        long previousEvents = count("TrackEvent", previous);
        long errors = count("ErrorEntry", range);
        long previousErrors = count("ErrorEntry", previous);
        long performance = count("PerformanceEntry", range);
        double lcp = averageLcp(range);
        double previousLcp = averageLcp(previous);

        List<Map<String, Object>> metrics = List.of(
                metric("visitors", visitors, percentTrend(visitors, previousVisitors)),
                metric("pageViews", pageViews, percentTrend(pageViews, previousPageViews)),
                metric("events", events, percentTrend(events, previousEvents)),
                metric("lcp", lcp, numberTrend(lcp, previousLcp, "s")),
                metric("errors", errors, numberTrend(errors, previousErrors, ""))
        );

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("metrics", metrics);
        result.put("trendData", trendData(range));
        result.put("topPaths", topPaths(range));
        result.put("eventRanks", eventRanks(range, events));
        result.put("recentErrors", recentErrors(range));
        result.put("moduleCounts", Map.of(
                "visitors", visitors,
                "pageViews", pageViews,
                "events", events,
                "performance", performance,
                "errors", errors
        ));
        return ApiResult.success(result);
    }

    public ApiResult<?> visitors(Map<String, String> query) {
        Pagination pagination = pagination(query);
        SqlWhere where = dateWhere(query, "");
        contains(where, "\"anonymousId\"", query.get("anonymousId"));
        contains(where, "\"userId\"", query.get("userId"));
        long total = queryCount("Visitor", where);
        String sql = """
                SELECT v.*,
                  (SELECT COUNT(*) FROM "PageView" p WHERE p."visitorId" = v.id) AS page_views,
                  (SELECT COUNT(*) FROM "TrackEvent" e WHERE e."visitorId" = v.id) AS events,
                  (SELECT COUNT(*) FROM "PerformanceEntry" p WHERE p."visitorId" = v.id) AS performance,
                  (SELECT COUNT(*) FROM "ErrorEntry" e WHERE e."visitorId" = v.id) AS errors
                FROM "Visitor" v %s ORDER BY v."createdAt" DESC LIMIT ? OFFSET ?
                """.formatted(where.sql());
        List<Object> args = new ArrayList<>(where.args());
        args.add(pagination.pageSize());
        args.add(pagination.skip());
        List<Map<String, Object>> list = jdbcTemplate.query(sql, this::mapVisitor, args.toArray());
        return ApiResult.success(pageResult(total, pagination, list));
    }

    public ApiResult<?> pageViews(Map<String, String> query) {
        return pageData("PageView", query, Map.of("path", "path", "url", "url"));
    }

    public ApiResult<?> events(Map<String, String> query) {
        return pageData("TrackEvent", query, Map.of("event", "event", "url", "url"));
    }

    public ApiResult<?> performanceList(Map<String, String> query) {
        return pageData("PerformanceEntry", query, Map.of());
    }

    public ApiResult<?> errors(Map<String, String> query) {
        return pageData("ErrorEntry", query, Map.of("error", "error", "url", "url"));
    }

    private ApiResult<?> pageData(
            String table,
            Map<String, String> query,
            Map<String, String> containsFilters
    ) {
        Pagination pagination = pagination(query);
        SqlWhere where = dateWhere(query, "t.");
        equals(where, "t.\"visitorId\"", query.get("visitorId"));
        containsFilters.forEach((queryName, column) ->
                contains(where, "t.\"" + column + "\"", query.get(queryName)));
        long total = queryCount(table + "\" t", where, true);
        String sql = """
                SELECT t.*, v.id AS visitor_id, v."anonymousId" AS visitor_anonymous_id,
                  v."userId" AS visitor_user_id, v.browser AS visitor_browser,
                  v.os AS visitor_os, v.device AS visitor_device
                FROM "%s" t JOIN "Visitor" v ON v.id = t."visitorId"
                %s ORDER BY t."createdAt" DESC LIMIT ? OFFSET ?
                """.formatted(table, where.sql());
        List<Object> args = new ArrayList<>(where.args());
        args.add(pagination.pageSize());
        args.add(pagination.skip());
        List<Map<String, Object>> list = jdbcTemplate.query(
                sql, (resultSet, row) -> mapTrackedRow(table, resultSet), args.toArray());
        return ApiResult.success(pageResult(total, pagination, list));
    }

    private List<Map<String, Object>> trendData(DateRange range) {
        LinkedHashMap<String, TrendItem> trends = new LinkedHashMap<>();
        ZonedDateTime cursor = range.start().atZone(ZoneId.systemDefault());
        ZonedDateTime end = range.end().atZone(ZoneId.systemDefault());
        while (!cursor.isAfter(end)) {
            String key = trendKey(cursor, range.hourly());
            trends.put(key, new TrendItem(label(cursor, range.hourly())));
            cursor = range.hourly() ? cursor.plusHours(1) : cursor.plusDays(1);
        }
        jdbcTemplate.query("""
                        SELECT "createdAt", "visitorId" FROM "PageView"
                        WHERE "createdAt" BETWEEN ? AND ? ORDER BY "createdAt"
                        """,
                resultSet -> {
                    TrendItem item = trends.get(trendKey(
                            resultSet.getTimestamp("createdAt").toInstant()
                                    .atZone(ZoneId.systemDefault()), range.hourly()));
                    if (item != null) {
                        item.pageViews++;
                        item.visitorIds.add(resultSet.getString("visitorId"));
                    }
                }, Timestamp.from(range.start()), Timestamp.from(range.end()));
        jdbcTemplate.query("""
                        SELECT "createdAt" FROM "TrackEvent"
                        WHERE "createdAt" BETWEEN ? AND ? ORDER BY "createdAt"
                        """,
                resultSet -> {
                    TrendItem item = trends.get(trendKey(
                            resultSet.getTimestamp("createdAt").toInstant()
                                    .atZone(ZoneId.systemDefault()), range.hourly()));
                    if (item != null) item.events++;
                }, Timestamp.from(range.start()), Timestamp.from(range.end()));
        return trends.values().stream().map(TrendItem::toMap).toList();
    }

    private List<Map<String, Object>> topPaths(DateRange range) {
        return jdbcTemplate.query("""
                SELECT path, COUNT(*) AS views, COUNT(DISTINCT "visitorId") AS visitors
                FROM "PageView" WHERE "createdAt" BETWEEN ? AND ?
                GROUP BY path ORDER BY views DESC LIMIT 5
                """, (rs, row) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("path", rs.getString("path"));
            item.put("views", rs.getLong("views"));
            item.put("visitors", rs.getLong("visitors"));
            return item;
        }, Timestamp.from(range.start()), Timestamp.from(range.end()));
    }

    private List<Map<String, Object>> eventRanks(DateRange range, long totalEvents) {
        return jdbcTemplate.query("""
                SELECT event, COUNT(*) AS count FROM "TrackEvent"
                WHERE "createdAt" BETWEEN ? AND ?
                GROUP BY event ORDER BY count DESC LIMIT 5
                """, (rs, row) -> {
            long count = rs.getLong("count");
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("event", rs.getString("event"));
            item.put("count", count);
            item.put("conversion", String.format("%.1f%%",
                    totalEvents == 0 ? 0 : count * 100.0 / totalEvents));
            return item;
        }, Timestamp.from(range.start()), Timestamp.from(range.end()));
    }

    private List<Map<String, Object>> recentErrors(DateRange range) {
        return jdbcTemplate.query("""
                SELECT id, error, message, url, "createdAt" FROM "ErrorEntry"
                WHERE "createdAt" BETWEEN ? AND ?
                ORDER BY "createdAt" DESC LIMIT 5
                """, (rs, row) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", rs.getString("id"));
            item.put("error", rs.getString("error"));
            item.put("message", rs.getString("message"));
            item.put("url", rs.getString("url"));
            item.put("createdAt", rs.getTimestamp("createdAt").toInstant());
            return item;
        }, Timestamp.from(range.start()), Timestamp.from(range.end()));
    }

    private Map<String, Object> mapVisitor(ResultSet rs, int row) throws SQLException {
        Map<String, Object> visitor = baseEntity(rs);
        visitor.put("anonymousId", rs.getString("anonymousId"));
        visitor.put("userId", rs.getString("userId"));
        visitor.put("browser", rs.getString("browser"));
        visitor.put("os", rs.getString("os"));
        visitor.put("device", rs.getString("device"));
        visitor.put("_count", Map.of(
                "pageViews", rs.getLong("page_views"),
                "trackEvents", rs.getLong("events"),
                "performanceEntries", rs.getLong("performance"),
                "errorEntries", rs.getLong("errors")
        ));
        return visitor;
    }

    private Map<String, Object> mapTrackedRow(String table, ResultSet rs) throws SQLException {
        Map<String, Object> item = baseEntity(rs);
        item.put("visitorId", rs.getString("visitorId"));
        switch (table) {
            case "PageView" -> {
                item.put("url", rs.getString("url"));
                item.put("referrer", rs.getString("referrer"));
                item.put("path", rs.getString("path"));
            }
            case "TrackEvent" -> {
                item.put("event", rs.getString("event"));
                item.put("payload", parseJson(rs.getObject("payload")));
                item.put("url", rs.getString("url"));
            }
            case "PerformanceEntry" -> {
                item.put("fp", rs.getObject("fp"));
                item.put("fcp", rs.getObject("fcp"));
                item.put("lcp", rs.getObject("lcp"));
                item.put("inp", rs.getObject("inp"));
                item.put("cls", rs.getObject("cls"));
            }
            case "ErrorEntry" -> {
                item.put("error", rs.getString("error"));
                item.put("message", rs.getString("message"));
                item.put("stack", rs.getString("stack"));
                item.put("url", rs.getString("url"));
            }
            default -> throw new IllegalArgumentException("Unsupported tracker table");
        }
        Map<String, Object> visitor = new LinkedHashMap<>();
        visitor.put("id", rs.getString("visitor_id"));
        visitor.put("anonymousId", rs.getString("visitor_anonymous_id"));
        visitor.put("userId", rs.getString("visitor_user_id"));
        visitor.put("browser", rs.getString("visitor_browser"));
        visitor.put("os", rs.getString("visitor_os"));
        visitor.put("device", rs.getString("visitor_device"));
        item.put("visitor", visitor);
        return item;
    }

    private Object parseJson(Object value) {
        if (value == null) return null;
        try {
            return objectMapper.readValue(value.toString(), Object.class);
        } catch (Exception exception) {
            return value.toString();
        }
    }

    private Map<String, Object> baseEntity(ResultSet rs) throws SQLException {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", rs.getString("id"));
        item.put("createdAt", rs.getTimestamp("createdAt").toInstant());
        item.put("updatedAt", rs.getTimestamp("updatedAt").toInstant());
        return item;
    }

    private Map<String, Object> pageResult(long total, Pagination pagination, List<?> list) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", total);
        result.put("page", pagination.page());
        result.put("pageSize", pagination.pageSize());
        result.put("list", list);
        return result;
    }

    private long count(String table, DateRange range) {
        return scalarLong("SELECT COUNT(*) FROM \"" + table +
                "\" WHERE \"createdAt\" BETWEEN ? AND ?", range);
    }

    private long scalarLong(String sql, DateRange range) {
        Long value = jdbcTemplate.queryForObject(sql, Long.class,
                Timestamp.from(range.start()), Timestamp.from(range.end()));
        return value == null ? 0 : value;
    }

    private double averageLcp(DateRange range) {
        Double value = jdbcTemplate.queryForObject("""
                SELECT AVG(lcp) FROM "PerformanceEntry"
                WHERE "createdAt" BETWEEN ? AND ?
                """, Double.class, Timestamp.from(range.start()), Timestamp.from(range.end()));
        return round((value == null ? 0 : value) / 1000.0, 2);
    }

    private Map<String, Object> metric(String key, Number value, String trend) {
        Map<String, Object> metric = new LinkedHashMap<>();
        metric.put("key", key);
        metric.put("value", value);
        metric.put("trend", trend);
        return metric;
    }

    private String percentTrend(long current, long previous) {
        if (previous == 0) return current > 0 ? "+100.0%" : "0.0%";
        double percent = (current - previous) * 100.0 / previous;
        return (percent >= 0 ? "+" : "") + String.format("%.1f%%", percent);
    }

    private String numberTrend(double current, double previous, String suffix) {
        double difference = round(current - previous, 2);
        String value = BigDecimal.valueOf(difference).stripTrailingZeros().toPlainString();
        return (difference >= 0 ? "+" : "") + value + suffix;
    }

    private double round(double value, int scale) {
        return BigDecimal.valueOf(value).setScale(scale, RoundingMode.HALF_UP).doubleValue();
    }

    private long queryCount(String table, SqlWhere where) {
        return queryCount(table, where, false);
    }

    private long queryCount(String table, SqlWhere where, boolean tableHasAlias) {
        String from = tableHasAlias ? "\"" + table : "\"" + table + "\"";
        Long value = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + from + " " + where.sql(),
                Long.class,
                where.args().toArray()
        );
        return value == null ? 0 : value;
    }

    private SqlWhere dateWhere(Map<String, String> query, String prefix) {
        SqlWhere where = new SqlWhere();
        if (query.get("range") == null && query.get("startDate") == null && query.get("endDate") == null) {
            return where;
        }
        DateRange range = dateRange(query);
        where.add(prefix + "\"createdAt\" BETWEEN ? AND ?",
                Timestamp.from(range.start()), Timestamp.from(range.end()));
        return where;
    }

    private void contains(SqlWhere where, String column, String value) {
        if (value != null && !value.isBlank()) {
            where.add(column + " LIKE ?", "%" + value + "%");
        }
    }

    private void equals(SqlWhere where, String column, String value) {
        if (value != null && !value.isBlank()) {
            where.add(column + " = ?", value);
        }
    }

    private Pagination pagination(Map<String, String> query) {
        int page = parseInt(query.get("page"), 1);
        int pageSize = Math.min(parseInt(query.get("pageSize"), 10), 100);
        return new Pagination(page, pageSize, (page - 1) * pageSize);
    }

    private int parseInt(String value, int fallback) {
        try {
            return Math.max(Integer.parseInt(value), 1);
        } catch (Exception exception) {
            return fallback;
        }
    }

    private DateRange dateRange(Map<String, String> query) {
        Instant end = parseDate(query.get("endDate"));
        if (end == null) end = Instant.now();
        Instant start = parseDate(query.get("startDate"));
        if (start == null) {
            ZonedDateTime startAt = end.atZone(ZoneId.systemDefault()).toLocalDate()
                    .atStartOfDay(ZoneId.systemDefault());
            if (!"today".equals(query.get("range"))) {
                startAt = startAt.minusDays("30d".equals(query.get("range")) ? 29 : 6);
            }
            start = startAt.toInstant();
        }
        return new DateRange(start, end, Duration.between(start, end).toHours() <= 24);
    }

    private DateRange previousRange(DateRange range) {
        Duration duration = Duration.between(range.start(), range.end());
        return new DateRange(range.start().minus(duration), range.start(), range.hourly());
    }

    private Instant parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return Instant.parse(value);
        } catch (DateTimeParseException ignored) {
        }
        try {
            return OffsetDateTime.parse(value).toInstant();
        } catch (DateTimeParseException ignored) {
        }
        try {
            return LocalDate.parse(value).atStartOfDay(ZoneId.systemDefault()).toInstant();
        } catch (DateTimeParseException ignored) {
            return null;
        }
    }

    private String trendKey(ZonedDateTime date, boolean hourly) {
        String day = "%04d-%02d-%02d".formatted(date.getYear(), date.getMonthValue(), date.getDayOfMonth());
        return hourly ? day + " %02d".formatted(date.getHour()) : day;
    }

    private String label(ZonedDateTime date, boolean hourly) {
        return hourly
                ? "%02d:00".formatted(date.getHour())
                : "%02d-%02d".formatted(date.getMonthValue(), date.getDayOfMonth());
    }

    private record DateRange(Instant start, Instant end, boolean hourly) {
    }

    private record Pagination(int page, int pageSize, int skip) {
    }

    private static final class SqlWhere {
        private final List<String> clauses = new ArrayList<>();
        private final List<Object> args = new ArrayList<>();

        void add(String clause, Object... values) {
            clauses.add(clause);
            args.addAll(List.of(values));
        }

        String sql() {
            return clauses.isEmpty() ? "" : "WHERE " + String.join(" AND ", clauses);
        }

        List<Object> args() {
            return args;
        }
    }

    private static final class TrendItem {
        private final String date;
        private int pageViews;
        private int events;
        private final Set<String> visitorIds = new LinkedHashSet<>();

        private TrendItem(String date) {
            this.date = date;
        }

        private Map<String, Object> toMap() {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("date", date);
            result.put("pageViews", pageViews);
            result.put("visitors", visitorIds.size());
            result.put("events", events);
            return result;
        }
    }
}
