package com.fitnessassist.dto;

import java.time.LocalDate;
import java.util.List;

public class ProgressDtos {

    public record WeightPoint(LocalDate date, double weightKg) {
    }

    public record WeightTrend(List<WeightPoint> points, Double startKg, Double latestKg, Double changeKg) {
    }

    public record StrengthPoint(LocalDate date, double maxWeightKg, double bestEstimated1Rm, double totalVolume) {
    }

    public record StrengthTrend(Long exerciseId, String exerciseName, List<StrengthPoint> points) {
    }

    public record VolumePoint(LocalDate weekStart, double volume, int sessions) {
    }
}
