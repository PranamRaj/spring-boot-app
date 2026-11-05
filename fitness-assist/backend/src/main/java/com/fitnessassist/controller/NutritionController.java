package com.fitnessassist.controller;

import com.fitnessassist.dto.NutritionDtos.DailyNutritionResponse;
import com.fitnessassist.dto.NutritionDtos.FoodLogRequest;
import com.fitnessassist.dto.NutritionDtos.FoodLogResponse;
import com.fitnessassist.service.NutritionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/nutrition")
@RequiredArgsConstructor
@Tag(name = "Nutrition")
public class NutritionController {

    private final NutritionService nutritionService;

    /** Totals, targets, remaining calories/macros and the meal entries for one day (default: today). */
    @GetMapping("/daily")
    public DailyNutritionResponse daily(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return nutritionService.daily(date);
    }

    @PostMapping("/food-logs")
    @ResponseStatus(HttpStatus.CREATED)
    public FoodLogResponse add(@Valid @RequestBody FoodLogRequest request) {
        return nutritionService.add(request);
    }

    @DeleteMapping("/food-logs/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        nutritionService.delete(id);
    }
}
