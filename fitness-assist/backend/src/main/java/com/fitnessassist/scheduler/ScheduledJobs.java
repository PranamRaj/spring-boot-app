package com.fitnessassist.scheduler;

import com.fitnessassist.config.AppClock;
import com.fitnessassist.model.User;
import com.fitnessassist.repository.UserRepository;
import com.fitnessassist.service.NutritionService;
import com.fitnessassist.service.SummaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Slf4j
@Component
@RequiredArgsConstructor
public class ScheduledJobs {

    private final UserRepository users;
    private final NutritionService nutritionService;
    private final SummaryService summaryService;
    private final AppClock clock;

    /** Every midnight: give each user a fresh calorie/macro allowance for the new day. */
    @Scheduled(cron = "0 0 0 * * *", zone = "${app.timezone}")
    public void dailyCalorieReset() {
        LocalDate today = clock.today();
        int count = 0;
        for (User u : users.findAll()) {
            nutritionService.ensureTarget(u, today);
            count++;
        }
        log.info("Daily reset: created/confirmed {} calorie targets for {}", count, today);
    }

    /** Every Monday 05:00: summarise the week that just ended (Monday to Sunday). */
    @Scheduled(cron = "0 0 5 * * MON", zone = "${app.timezone}")
    public void weeklyConsistencySummary() {
        LocalDate lastMonday = SummaryService.mondayOf(clock.today()).minusWeeks(1);
        int count = 0;
        for (User u : users.findAll()) {
            summaryService.generateIfMissing(u, lastMonday);
            count++;
        }
        log.info("Weekly summaries generated for week starting {} ({} users)", lastMonday, count);
    }
}
