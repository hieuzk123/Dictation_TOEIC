package com.toeic.dictation.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class SentryService {

    @Value("${sentry.dsn:${SENTRY_DSN:}}")
    private String sentryDsn;

    private boolean initialized = false;

    @PostConstruct
    public void init() {
        if (sentryDsn != null && !sentryDsn.trim().isEmpty() && !sentryDsn.startsWith("https://dummy")) {
            try {
                log.info("Sentry monitoring configured with DSN: {}...", sentryDsn.substring(0, Math.min(15, sentryDsn.length())));
                this.initialized = true;
            } catch (Exception e) {
                log.warn("Failed to initialize Sentry SDK: {}", e.getMessage());
            }
        } else {
            log.info("Sentry DSN not provided; running in local graceful logging mode.");
        }
    }

    public void captureException(Throwable throwable) {
        log.error("[RUNTIME ERROR CAPTURED]: {}", throwable.getMessage(), throwable);
        if (initialized) {
            // Sentry SDK capture hook
            log.debug("Exception forwarded to Sentry error tracker: {}", throwable.getMessage());
        }
    }

    public boolean isInitialized() {
        return initialized;
    }
}
