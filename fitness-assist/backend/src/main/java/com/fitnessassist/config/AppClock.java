package com.fitnessassist.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

/** Single source of "today" so API defaults and scheduled jobs agree on the time zone. */
@Component
public class AppClock {

    private final ZoneId zone;

    public AppClock(@Value("${app.timezone}") String timezone) {
        this.zone = ZoneId.of(timezone);
    }

    public LocalDate today() {
        return LocalDate.now(zone);
    }

    public LocalDateTime now() {
        return LocalDateTime.now(zone);
    }
}
