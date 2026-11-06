package com.fitnessassist.dto;

import com.fitnessassist.model.*;
import jakarta.validation.constraints.*;

public class ProfileDtos {

    public record UpdateProfileRequest(
            @NotBlank String name,
            @NotNull Sex sex,
            @NotNull @Min(10) @Max(100) Integer age,
            @NotNull @DecimalMin("100") @DecimalMax("250") Double heightCm,
            @NotNull @DecimalMin("30") @DecimalMax("400") Double weightKg,
            @NotNull ActivityLevel activityLevel,
            @NotNull FitnessGoal goal,
            @Min(1) @Max(14) Integer weeklyWorkoutTarget) {
    }

    public record ProfileResponse(
            Long id, String name, String email, Sex sex, Integer age, Double heightCm, Double weightKg,
            ActivityLevel activityLevel, FitnessGoal goal,
            Integer dailyCalorieTarget, Integer proteinTargetG, Integer carbsTargetG, Integer fatTargetG,
            Integer weeklyWorkoutTarget, Role role) {

        public static ProfileResponse from(User u) {
            return new ProfileResponse(u.getId(), u.getName(), u.getEmail(), u.getSex(), u.getAge(),
                    u.getHeightCm(), u.getWeightKg(), u.getActivityLevel(), u.getGoal(),
                    u.getDailyCalorieTarget(), u.getProteinTargetG(), u.getCarbsTargetG(), u.getFatTargetG(),
                    u.getWeeklyWorkoutTarget(), u.getRole());
        }
    }
}
