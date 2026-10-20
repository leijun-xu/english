package com.english.server.socket;

import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketIOServer;
import com.english.server.config.AppProperties;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Service;

@Service
public class SocketServerService {
    private final SocketIOServer server;
    private final boolean enabled;

    public SocketServerService(AppProperties properties) {
        AppProperties.Socket socket = properties.socket();
        this.enabled = socket.enabled();
        if (!enabled) {
            this.server = null;
            return;
        }
        Configuration configuration = new Configuration();
        configuration.setHostname(socket.host());
        configuration.setPort(socket.port());
        configuration.setOrigin("*");
        this.server = new SocketIOServer(configuration);
        this.server.addConnectListener(client -> {
            String userId = client.getHandshakeData().getSingleUrlParam("userId");
            if (userId != null && !userId.isBlank()) {
                client.joinRoom("user_" + userId);
            }
        });
        this.server.start();
    }

    public void emitPaymentSuccess(String userId) {
        if (enabled) {
            server.getRoomOperations("user_" + userId).sendEvent("paymentSuccess", userId);
        }
    }

    @PreDestroy
    public void stop() {
        if (enabled) {
            server.stop();
        }
    }
}
