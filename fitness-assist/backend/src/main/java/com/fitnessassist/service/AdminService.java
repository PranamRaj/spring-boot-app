package com.fitnessassist.service;

import com.fitnessassist.config.AppClock;
import com.fitnessassist.dto.AdminDtos.*;
import com.fitnessassist.dto.AuthDtos.RegisterRequest;
import com.fitnessassist.dto.ProfileDtos.ProfileResponse;
import com.fitnessassist.dto.SummaryDtos.WeeklySummaryResponse;
import com.fitnessassist.exception.ResourceNotFoundException;
import com.fitnessassist.model.FitnessGoal;
import com.fitnessassist.model.Role;
import com.fitnessassist.model.User;
import com.fitnessassist.model.WorkoutSession;
import com.fitnessassist.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private static final LocalDateTime ALL_TIME = LocalDateTime.of(2000, 1, 1, 0, 0);
    private static final int CHART_WEEKS = 8;

    private final UserRepository users;
    private final WorkoutSessionRepository sessions;
    private final WorkoutRoutineRepository routines;
    private final BodyMetricRepository metrics;
    private final FoodLogRepository foodLogs;
    private final DailyTargetRepository dailyTargets;
    private final WeeklySummaryRepository summaries;
    private final AuthService authService;
    private final PasswordEncoder passwordEncoder;
    private final AppClock clock;

    /* ----------------------------------------------------------------- reads */

    @Transactional(readOnly = true)
    public List<TraineeRow> trainees() {
        return buildRows(users.findByRoleOrderByCreatedAtDesc(Role.TRAINEE));
    }

    @Transactional(readOnly = true)
    public Overview overview() {
        List<TraineeRow> rows = trainees();
        LocalDate today = clock.today();

        long active = rows.stream().filter(r -> r.engagement() == Engagement.ACTIVE).count();
        long suspended = rows.stream().filter(r -> !r.active()).count();
        long newLast30 = rows.stream()
                .filter(r -> r.joinedAt() != null && !r.joinedAt().toLocalDate().isBefore(today.minusDays(30)))
                .count();
        long workouts7 = rows.stream().mapToLong(TraineeRow::workoutsLast7Days).sum();
        double volume7 = round1(rows.stream().mapToDouble(TraineeRow::volumeLast7Days).sum());

        List<Integer> scores = rows.stream().map(TraineeRow::consistencyScore).filter(Objects::nonNull).toList();
        Integer avgScore = scores.isEmpty() ? null
                : (int) Math.round(scores.stream().mapToInt(Integer::intValue).average().orElse(0));

        // Share of non-suspended trainees who have already hit their weekly workout target in the last 7 days.
        List<TraineeRow> enabled = rows.stream().filter(TraineeRow::active).toList();
        int hitRate = enabled.isEmpty() ? 0 : (int) Math.round(100.0
                * enabled.stream().filter(r -> r.workoutsLast7Days() >= r.weeklyWorkoutTarget()).count()
                / enabled.size());

        // Weekly buckets, oldest first, ending with the current (partial) week.
        LocalDate firstMonday = SummaryService.mondayOf(today).minusWeeks(CHART_WEEKS - 1);
        Map<LocalDate, Long> workoutWeeks = sessions.finishedStartTimesSince(firstMonday.atStartOfDay()).stream()
                .collect(Collectors.groupingBy(t -> SummaryService.mondayOf(t.toLocalDate()), Collectors.counting()));
        Map<LocalDate, Long> signupWeeks = rows.stream()
                .filter(r -> r.joinedAt() != null && !r.joinedAt().toLocalDate().isBefore(firstMonday))
                .collect(Collectors.groupingBy(r -> SummaryService.mondayOf(r.joinedAt().toLocalDate()),
                        Collectors.counting()));
        List<WeekCount> workoutsByWeek = new ArrayList<>();
        List<WeekCount> signupsByWeek = new ArrayList<>();
        for (int i = 0; i < CHART_WEEKS; i++) {
            LocalDate wk = firstMonday.plusWeeks(i);
            workoutsByWeek.add(new WeekCount(wk, workoutWeeks.getOrDefault(wk, 0L)));
            signupsByWeek.add(new WeekCount(wk, signupWeeks.getOrDefault(wk, 0L)));
        }

        Map<FitnessGoal, Long> byGoal = rows.stream()
                .collect(Collectors.groupingBy(TraineeRow::goal, () -> new EnumMap<>(FitnessGoal.class),
                        Collectors.counting()));
        List<GoalCount> goals = Arrays.stream(FitnessGoal.values())
                .map(g -> new GoalCount(g, byGoal.getOrDefault(g, 0L))).toList();

        List<TraineeRow> leaderboard = enabled.stream()
                .filter(r -> r.workoutsLast7Days() > 0)
                .sorted(Comparator.comparingLong(TraineeRow::workoutsLast7Days)
                        .thenComparingDouble(TraineeRow::volumeLast7Days).reversed())
                .limit(5).toList();

        // Longest-silent first; trainees who have never logged anything come first of all.
        List<TraineeRow> needsAttention = enabled.stream()
                .filter(r -> r.engagement() == Engagement.INACTIVE)
                .sorted(Comparator.comparing(TraineeRow::daysSinceActive,
                        Comparator.nullsFirst(Comparator.<Long>reverseOrder())))
                .limit(6).toList();

        return new Overview(rows.size(), active, newLast30, suspended, workouts7, volume7, avgScore, hitRate,
                workoutsByWeek, signupsByWeek, goals, leaderboard, needsAttention);
    }

    @Transactional(readOnly = true)
    public TraineeDetail detail(Long id) {
        User u = trainee(id);
        TraineeRow stats = buildRows(List.of(u)).get(0);

        List<SessionItem> recent = sessions.findTop10ByUserIdOrderByStartedAtDesc(id).stream()
                .map(this::toSessionItem).toList();
        List<WeightPoint> weights = metrics.findByUserIdOrderByDateAsc(id).stream()
                .map(m -> new WeightPoint(m.getDate(), m.getWeightKg())).toList();
        List<WeeklySummaryResponse> weekly = summaries.findTop8ByUserIdOrderByWeekStartDesc(id).stream()
                .map(WeeklySummaryResponse::from).toList();

        return new TraineeDetail(ProfileResponse.from(u), stats, u.getCoachNotes(), recent, weights, weekly);
    }

    /* ---------------------------------------------------------------- writes */

    @Transactional
    public TraineeRow create(RegisterRequest r) {
        return buildRows(List.of(authService.createTrainee(r))).get(0);
    }

    @Transactional
    public TraineeRow setActive(Long id, boolean active) {
        User u = trainee(id);
        u.setActive(active);
        users.save(u);
        return buildRows(List.of(u)).get(0);
    }

    @Transactional
    public void resetPassword(Long id, String password) {
        User u = trainee(id);
        u.setPassword(passwordEncoder.encode(password));
        users.save(u);
    }

    @Transactional
    public String saveNotes(Long id, String notes) {
        User u = trainee(id);
        u.setCoachNotes(notes == null || notes.isBlank() ? null : notes.trim());
        users.save(u);
        return u.getCoachNotes();
    }

    /** Removes the trainee and everything they logged. Workout sets and routine items go via cascade. */
    @Transactional
    public void delete(Long id) {
        purge(trainee(id));
    }

    /** Deletes a user of any role together with all rows that reference them. */
    @Transactional
    public void purge(User u) {
        Long id = u.getId();
        sessions.deleteByUserId(id);
        routines.deleteByUserId(id);
        foodLogs.deleteByUserId(id);
        dailyTargets.deleteByUserId(id);
        summaries.deleteByUserId(id);
        metrics.deleteByUserId(id);
        users.delete(u);
    }

    /* --------------------------------------------------------------- helpers */

    /** Only trainee accounts are reachable here, so an admin can never suspend or delete an admin. */
    private User trainee(Long id) {
        return users.findByIdAndRole(id, Role.TRAINEE)
                .orElseThrow(() -> new ResourceNotFoundException("Trainee not found"));
    }

    private List<TraineeRow> buildRows(List<User> list) {
        if (list.isEmpty()) {
            return List.of();
        }
        LocalDate today = clock.today();
        LocalDateTime weekAgo = today.minusDays(6).atStartOfDay();

        Map<Long, AdminStats.WorkoutAgg> allTime =
                byUser(sessions.finishedStatsSince(ALL_TIME), AdminStats.WorkoutAgg::getUserId);
        Map<Long, AdminStats.WorkoutAgg> recent =
                byUser(sessions.finishedStatsSince(weekAgo), AdminStats.WorkoutAgg::getUserId);
        Map<Long, AdminStats.Weight> first = byUser(metrics.firstWeightPerUser(), AdminStats.Weight::getUserId);
        Map<Long, AdminStats.Weight> latest = byUser(metrics.latestWeightPerUser(), AdminStats.Weight::getUserId);
        Map<Long, AdminStats.Score> scores = byUser(summaries.latestScorePerUser(), AdminStats.Score::getUserId);
        Map<Long, AdminStats.LastDate> food = byUser(foodLogs.lastLogDatePerUser(), AdminStats.LastDate::getUserId);

        List<TraineeRow> rows = new ArrayList<>(list.size());
        for (User u : list) {
            Long id = u.getId();
            AdminStats.WorkoutAgg all = allTime.get(id);
            AdminStats.WorkoutAgg wk = recent.get(id);

            LocalDate lastWorkout = all == null || all.getLastAt() == null ? null : all.getLastAt().toLocalDate();
            LocalDate lastFood = food.containsKey(id) ? food.get(id).getLastDate() : null;
            LocalDate lastActive = later(lastWorkout, lastFood);
            Long daysSince = lastActive == null ? null : ChronoUnit.DAYS.between(lastActive, today);

            Double startW = first.containsKey(id) ? first.get(id).getWeightKg() : null;
            Double currentW = latest.containsKey(id) ? latest.get(id).getWeightKg() : u.getWeightKg();
            Double change = startW == null || currentW == null ? null : round1(currentW - startW);

            LocalDate joined = u.getCreatedAt() == null ? null : u.getCreatedAt().toLocalDate();
            Engagement eng;
            if (!u.isActive()) {
                eng = Engagement.SUSPENDED;
            } else if (daysSince != null && daysSince <= 6) {
                eng = Engagement.ACTIVE;
            } else if (joined != null && !joined.isBefore(today.minusDays(6))) {
                eng = Engagement.NEW;
            } else {
                eng = Engagement.INACTIVE;
            }

            rows.add(new TraineeRow(id, u.getName(), u.getEmail(), u.getGoal(), u.isActive(), eng,
                    u.getCreatedAt(), lastActive, daysSince, startW, currentW, change,
                    all == null ? 0 : all.getWorkouts(), all == null ? 0 : round1(all.getVolume()),
                    wk == null ? 0 : wk.getWorkouts(), wk == null ? 0 : round1(wk.getVolume()),
                    u.getWeeklyWorkoutTarget(),
                    scores.containsKey(id) ? scores.get(id).getScore() : null));
        }
        return rows;
    }

    private SessionItem toSessionItem(WorkoutSession s) {
        Long minutes = s.getFinishedAt() == null ? null
                : Duration.between(s.getStartedAt(), s.getFinishedAt()).toMinutes();
        return new SessionItem(s.getId(), s.getName(), s.getStartedAt(), s.isFinished(), minutes,
                s.getSets().size(), s.getTotalVolume());
    }

    private static <T> Map<Long, T> byUser(List<T> list, Function<T, Long> key) {
        return list.stream().collect(Collectors.toMap(key, Function.identity(), (a, b) -> a));
    }

    private static LocalDate later(LocalDate a, LocalDate b) {
        if (a == null) return b;
        if (b == null) return a;
        return a.isAfter(b) ? a : b;
    }

    private static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
