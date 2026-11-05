package com.fitnessassist.dto;

import com.fitnessassist.model.*;
import jakarta.validation.constraints.*;

public class AuthDtos {

    public record RegisterRequest(
            @NotBlank String name,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8, message = "Password must be at least 8 characters") String password,
            @NotNull Sex sex,
            @NotNull @Min(10) @Max(100) Integer age,
            @NotNull @DecimalMin("100") @DecimalMax("250") Double heightCm,
            @NotNull @DecimalMin("30") @DecimalMax("400") Double weightKg,
            @NotNull ActivityLevel activityLevel,
            @NotNull FitnessGoal goal) {
    }

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {
    }

    public record AuthResponse(String token, ProfileDtos.ProfileResponse user) {
    }
}
