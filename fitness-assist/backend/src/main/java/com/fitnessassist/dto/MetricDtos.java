package com.fitnessassist.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class MetricDtos {

    public record MetricRequest(
            LocalDate date,
            @NotNull @DecimalMin("20") Double weightKg,
            @DecimalMin("0") Double waistCm,
            @DecimalMin("0") Double chestCm,
            @DecimalMin("0") Double hipsCm,
            @DecimalMin("0") Double armCm,
            @DecimalMin("0") Double thighCm) {
    }

    public record MetricResponse(Long id, LocalDate date, double weightKg,
                                 Double waistCm, Double chestCm, Double hipsCm, Double armCm, Double thighCm) {
    }
}
