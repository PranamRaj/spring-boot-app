package com.fitnessassist.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** Per-trainee aggregate projections, so the admin list is a handful of queries rather than one per trainee. */
public final class AdminStats {

    private AdminStats() {
    }

    public interface WorkoutAgg {
        Long getUserId();

        Long getWorkouts();

        Double getVolume();

        LocalDateTime getLastAt();
    }

    public interface Weight {
        Long getUserId();

        Double getWeightKg();
    }

    public interface Score {
        Long getUserId();

        Integer getScore();
    }

    public interface LastDate {
        Long getUserId();

        LocalDate getLastDate();
    }
}
