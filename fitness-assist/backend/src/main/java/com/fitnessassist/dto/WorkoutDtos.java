package com.fitnessassist.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;

public class WorkoutDtos {

    public record StartSessionRequest(Long routineId, @Size(max = 100) String name) {
    }

    public record AddSetRequest(
            @NotNull Long exerciseId,
            @Min(1) @Max(1000) int reps,
            @DecimalMin("0") @DecimalMax("1000") double weightKg) {
    }

    public record SetResponse(Long id, Long exerciseId, String exerciseName,
                              int setNumber, int reps, double weightKg, double volume) {
    }

    public record ExerciseVolume(Long exerciseId, String exerciseName, int sets, double volume) {
    }

    /** Returned after every change so the UI gets immediate volume feedback per exercise and per session. */
    public record SessionResponse(Long id, String name, Long routineId,
                                  LocalDateTime startedAt, LocalDateTime finishedAt, boolean finished,
                                  double totalVolume, Long durationMinutes,
                                  List<SetResponse> sets, List<ExerciseVolume> exerciseVolumes) {
    }
}
