package com.fitnessassist.dto;

import com.fitnessassist.model.MealType;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.List;

public class NutritionDtos {

    public record FoodLogRequest(
            LocalDate date,
            @NotNull MealType mealType,
            @NotBlank @Size(max = 150) String foodName,
            @NotNull @Min(0) @Max(10000) Integer calories,
            @NotNull @DecimalMin("0") Double proteinG,
            @NotNull @DecimalMin("0") Double carbsG,
            @NotNull @DecimalMin("0") Double fatG) {
    }

    public record FoodLogResponse(Long id, LocalDate date, MealType mealType, String foodName,
                                  int calories, double proteinG, double carbsG, double fatG) {
    }

    public record MacroTotals(int calories, double proteinG, double carbsG, double fatG) {
    }

    public record DailyNutritionResponse(LocalDate date, MacroTotals target, MacroTotals consumed,
                                         MacroTotals remaining, boolean overCalorieTarget,
                                         List<FoodLogResponse> entries) {
    }
}
