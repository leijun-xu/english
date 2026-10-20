package com.english.server.pay;

import com.alipay.api.AlipayClient;
import com.alipay.api.DefaultAlipayClient;
import com.alipay.api.domain.AlipayTradePagePayModel;
import com.alipay.api.request.AlipayTradePagePayRequest;
import com.english.server.auth.AuthUser;
import com.english.server.common.ApiResult;
import com.english.server.domain.CourseRecordEntity;
import com.english.server.domain.PaymentRecordEntity;
import com.english.server.domain.TradeStatus;
import com.english.server.repository.CourseRecordRepository;
import com.english.server.repository.PaymentRecordRepository;
import com.english.server.socket.SocketServerService;
import com.english.server.config.AppProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class PayService {
    private static final char[] TRADE_CHARS =
            "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".toCharArray();
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter ALIPAY_TIME =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final PaymentRecordRepository paymentRecordRepository;
    private final CourseRecordRepository courseRecordRepository;
    private final SocketServerService socketServerService;
    private final ObjectMapper objectMapper;
    private final AppProperties.Alipay properties;
    private final AlipayClient alipayClient;

    public PayService(
            PaymentRecordRepository paymentRecordRepository,
            CourseRecordRepository courseRecordRepository,
            SocketServerService socketServerService,
            ObjectMapper objectMapper,
            AppProperties appProperties
    ) {
        this.paymentRecordRepository = paymentRecordRepository;
        this.courseRecordRepository = courseRecordRepository;
        this.socketServerService = socketServerService;
        this.objectMapper = objectMapper;
        this.properties = appProperties.alipay();
        this.alipayClient = new DefaultAlipayClient(
                properties.gateway(),
                properties.appId(),
                properties.privateKey(),
                "json",
                "UTF-8",
                properties.publicKey(),
                "RSA2"
        );
    }

    @Transactional
    public ApiResult<?> create(PayContracts.Create request, AuthUser user) throws Exception {
        if (courseRecordRepository.findFirstByUserIdAndCourseId(user.userId(), request.courseId()).isPresent()) {
            return ApiResult.error("您已经购买过该课程");
        }
        String outTradeNo = createTradeNo();
        PaymentRecordEntity payment = new PaymentRecordEntity();
        payment.setUserId(user.userId());
        payment.setOutTradeNo(outTradeNo);
        payment.setAmount(new BigDecimal(request.totalAmount()));
        payment.setSubject(request.subject());
        payment.setBody(request.body());
        paymentRecordRepository.save(payment);

        LocalDateTime expires = LocalDateTime.now().plusMinutes(1);
        AlipayTradePagePayModel model = new AlipayTradePagePayModel();
        model.setOutTradeNo(outTradeNo);
        model.setTotalAmount(request.totalAmount());
        model.setSubject(request.subject());
        model.setBody(objectMapper.writeValueAsString(
                Map.of("courseId", request.courseId(), "userId", user.userId())));
        model.setProductCode("FAST_INSTANT_TRADE_PAY");
        model.setTimeExpire(expires.format(ALIPAY_TIME));

        AlipayTradePagePayRequest payRequest = new AlipayTradePagePayRequest();
        payRequest.setBizModel(model);
        payRequest.setNotifyUrl(properties.notifyUrl() + "/api/v1/pay/notify");
        String payUrl = alipayClient.pageExecute(payRequest, "GET").getBody();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("payUrl", payUrl);
        result.put("timeExpire", expires.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
        return ApiResult.success(result);
    }

    @Transactional
    public ApiResult<?> notify(Map<String, String> body) throws Exception {
        PaymentRecordEntity payment = paymentRecordRepository
                .findByOutTradeNo(body.get("out_trade_no"))
                .orElseThrow();
        payment.setTradeNo(body.get("trade_no"));
        payment.setTradeStatus(TradeStatus.TRADE_SUCCESS);
        if (body.get("gmt_payment") != null) {
            payment.setSendPayTime(LocalDateTime.parse(body.get("gmt_payment"), ALIPAY_TIME)
                    .atZone(ZoneId.systemDefault()).toInstant());
        }
        paymentRecordRepository.save(payment);

        Map<?, ?> metadata = objectMapper.readValue(body.get("body"), Map.class);
        String userId = metadata.get("userId").toString();
        CourseRecordEntity courseRecord = new CourseRecordEntity();
        courseRecord.setUserId(userId);
        courseRecord.setCourseId(metadata.get("courseId").toString());
        courseRecord.setPurchased(true);
        courseRecord.setPaymentRecordId(payment.getId());
        courseRecordRepository.save(courseRecord);
        socketServerService.emitPaymentSuccess(userId);
        return ApiResult.success(null);
    }

    private String createTradeNo() {
        StringBuilder value = new StringBuilder("XM-");
        for (int index = 0; index < 12; index++) {
            value.append(TRADE_CHARS[RANDOM.nextInt(TRADE_CHARS.length)]);
        }
        return value.toString();
    }
}
