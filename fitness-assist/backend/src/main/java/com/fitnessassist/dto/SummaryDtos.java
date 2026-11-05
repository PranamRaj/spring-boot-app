package com.fitnessassist.dto;

import com.fitnessassist.model.WeeklySummary;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class SummaryDtos {

    public record WeeklySummaryResponse(Long id, LocalDate weekStart, LocalDate weekEnd,
                                        int workoutsCompleted, double totalVolume,
                                        int daysFoodLogged, int avgDailyCalories,
                                        Double weightChangeKg, int consistencyScore,
                                        LocalDateTime generatedAt) {
        public static WeeklySummaryResponse from(WeeklySummary s) {
            return new WeeklySummaryResponse(s.getId(), s.getWeekStart(), s.getWeekEnd(),
                    s.getWorkoutsCompleted(), s.getTotalVolume(), s.getDaysFoodLogged(),
                    s.getAvgDailyCalories(), s.getWeightChangeKg(), s.getConsistencyScore(),
                    s.getGeneratedAt());
        }
    }
}
