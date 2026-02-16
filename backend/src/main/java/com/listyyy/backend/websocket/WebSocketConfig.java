package com.listyyy.backend.websocket;

import com.listyyy.backend.auth.JwtService;
import com.listyyy.backend.auth.User;
import com.listyyy.backend.auth.UserRepository;
import com.listyyy.backend.list.ListAccessService;
import com.listyyy.backend.workspace.WorkspaceAccessService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import org.springframework.beans.factory.annotation.Value;

import java.util.Collections;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final Pattern LIST_TOPIC_PATTERN = Pattern.compile("^/topic/lists/([0-9a-fA-F-]{36})$");
    private static final Pattern WORKSPACE_TOPIC_PATTERN = Pattern.compile("^/topic/workspaces/([0-9a-fA-F-]{36})$");

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final ListAccessService listAccessService;
    private final WorkspaceAccessService workspaceAccessService;

    @Value("${listyyy.cors.allowed-origins:http://localhost:5173}")
    private String corsAllowedOrigins;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(corsAllowedOrigins.split(",\\s*"))
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null) return message;

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String auth = accessor.getFirstNativeHeader("Authorization");
                    if (auth != null && auth.startsWith("Bearer ")) {
                        String token = auth.substring(7);
                        if (jwtService.validateToken(token)) {
                            try {
                                UUID userId = jwtService.getUserIdFromToken(token);
                                userRepository.findById(userId).ifPresent(user -> {
                                    accessor.setUser(new UsernamePasswordAuthenticationToken(user, null, Collections.emptyList()));
                                });
                            } catch (Exception ignored) {
                            }
                        }
                    }
                }

                if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                    String destination = accessor.getDestination();
                    if (destination != null) {
                        Matcher listMatcher = LIST_TOPIC_PATTERN.matcher(destination);
                        Matcher wsMatcher = WORKSPACE_TOPIC_PATTERN.matcher(destination);
                        if (listMatcher.matches()) {
                            User user = getAuthenticatedUser(accessor);
                            if (user == null) {
                                log.warn("Unauthenticated SUBSCRIBE to {}", destination);
                                throw new IllegalArgumentException("אין גישה");
                            }
                            UUID listId = UUID.fromString(listMatcher.group(1));
                            if (!listAccessService.canAccess(user, listId)) {
                                log.warn("User {} denied SUBSCRIBE to list {}", user.getId(), listId);
                                throw new IllegalArgumentException("אין גישה");
                            }
                        } else if (wsMatcher.matches()) {
                            User user = getAuthenticatedUser(accessor);
                            if (user == null) {
                                log.warn("Unauthenticated SUBSCRIBE to {}", destination);
                                throw new IllegalArgumentException("אין גישה");
                            }
                            UUID workspaceId = UUID.fromString(wsMatcher.group(1));
                            if (!workspaceAccessService.canAccess(user, workspaceId)) {
                                log.warn("User {} denied SUBSCRIBE to workspace {}", user.getId(), workspaceId);
                                throw new IllegalArgumentException("אין גישה");
                            }
                        }
                    }
                }

                return message;
            }
        });
    }

    private User getAuthenticatedUser(StompHeaderAccessor accessor) {
        if (accessor.getUser() instanceof UsernamePasswordAuthenticationToken auth) {
            Object principal = auth.getPrincipal();
            if (principal instanceof User user) {
                return user;
            }
        }
        return null;
    }
}
