package com.fitnessassist.dto;

import com.fitnessassist.dto.ProfileDtos.ProfileResponse;
import com.fitnessassist.dto.SummaryDtos.WeeklySummaryResponse;
import com.fitnessassist.model.FitnessGoal;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class AdminDtos {

    /**
     * How engaged a trainee is right now.
     * ACTIVE: trained or logged food in the last 7 days. NEW: joined in the last 7 days with nothing logged yet.
     * INACTIVE: nothing in the last 7 days. SUSPENDED: account switched off by an admin.
     */
    public enum Engagement { ACTIVE, NEW, INACTIVE, SUSPENDED }

    public record TraineeRow(
            Long id, String name, String email, FitnessGoal goal, boolean active, Engagement engagement,
            LocalDateTime joinedAt, LocalDate lastActive, Long daysSinceActive,
            Double startWeightKg, Double currentWeightKg, Double weightChangeKg,
            long totalWorkouts, double totalVolume,
            long workoutsLast7Days, double volumeLast7Days, int weeklyWorkoutTarget,
            Integer consistencyScore) {
    }

    public record WeekCount(LocalDate weekStart, long count) {
    }

    public record GoalCount(FitnessGoal goal, long count) {
    }

    public record Overview(
            long totalTrainees, long activeLast7Days, long newLast30Days, long suspended,
            long workoutsLast7Days, double volumeLast7Days, Integer avgConsistency, int targetHitRate,
            List<WeekCount> workoutsByWeek, List<WeekCount> signupsByWeek, List<GoalCount> goals,
            List<TraineeRow> leaderboard, List<TraineeRow> needsAttention) {
    }

    public record SessionItem(Long id, String name, LocalDateTime startedAt, boolean finished,
                              Long durationMinutes, int sets, double totalVolume) {
    }

    public record WeightPoint(LocalDate date, double weightKg) {
    }

    public record TraineeDetail(ProfileResponse profile, TraineeRow stats, String coachNotes,
                                List<SessionItem> recentSessions, List<WeightPoint> weightHistory,
                                List<WeeklySummaryResponse> weeklySummaries) {
    }

    public record StatusRequest(@NotNull Boolean active) {
    }

    public record ResetPasswordRequest(
            @NotBlank @Size(min = 8, message = "Password must be at least 8 characters") String password) {
    }

    public record NotesRequest(@Size(max = 2000, message = "Notes can be at most 2000 characters") String notes) {
    }
}
