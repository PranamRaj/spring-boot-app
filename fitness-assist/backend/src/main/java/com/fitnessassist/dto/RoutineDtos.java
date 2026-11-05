package com.fitnessassist.dto;

import com.fitnessassist.model.MuscleGroup;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.util.List;

public class RoutineDtos {

    public record RoutineExerciseRequest(
            @NotNull Long exerciseId,
            @Min(1) @Max(20) int targetSets,
            @Min(1) @Max(100) int targetReps) {
    }

    public record RoutineRequest(
            @NotBlank String name,
            @Size(max = 1000) String notes,
            @NotEmpty @Valid List<RoutineExerciseRequest> exercises) {
    }

    public record RoutineExerciseResponse(Long id, Long exerciseId, String exerciseName,
                                          MuscleGroup muscleGroup, int targetSets, int targetReps, int orderIndex) {
    }

    public record RoutineResponse(Long id, String name, String notes, List<RoutineExerciseResponse> exercises) {
    }
}
