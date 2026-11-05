package com.fitnessassist.service;

import com.fitnessassist.config.AppClock;
import com.fitnessassist.dto.SummaryDtos.WeeklySummaryResponse;
import com.fitnessassist.model.BodyMetric;
import com.fitnessassist.model.FoodLog;
import com.fitnessassist.model.User;
import com.fitnessassist.model.WeeklySummary;
import com.fitnessassist.model.WorkoutSession;
import com.fitnessassist.repository.BodyMetricRepository;
import com.fitnessassist.repository.FoodLogRepository;
import com.fitnessassist.repository.WeeklySummaryRepository;
import com.fitnessassist.repository.WorkoutSessionRepository;
import com.fitnessassist.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SummaryService {

    private final WeeklySummaryRepository summaries;
    private final WorkoutSessionRepository sessions;
    private final FoodLogRepository foodLogs;
    private final BodyMetricRepository metrics;
    private final CurrentUser currentUser;
    private final AppClock clock;

    @Transactional(readOnly = true)
    public List<WeeklySummaryResponse> list() {
        return summaries.findByUserIdOrderByWeekStartDesc(currentUser.get().getId())
                .stream().map(WeeklySummaryResponse::from).toList();
    }

    /** On-demand generation for the Monday-starting week containing the given date (default: this week so far). */
    @Transactional
    public WeeklySummaryResponse generateFor(LocalDate anyDayInWeek) {
        LocalDate day = anyDayInWeek == null ? clock.today() : anyDayInWeek;
        return WeeklySummaryResponse.from(generate(currentUser.get(), mondayOf(day)));
    }

    /** Used by the weekly scheduled job: builds last week's summary unless it already exists. */
    @Transactional
    public void generateIfMissing(User user, LocalDate weekStart) {
        if (summaries.findByUserIdAndWeekStart(user.getId(), weekStart).isEmpty()) {
            generate(user, weekStart);
        }
    }

    public static LocalDate mondayOf(LocalDate d) {
        return d.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    private WeeklySummary generate(User user, LocalDate weekStart) {
        LocalDate weekEnd = weekStart.plusDays(6);

        List<WorkoutSession> finished = sessions
                .findByUserIdAndStartedAtGreaterThanEqualAndStartedAtLessThan(
                        user.getId(), weekStart.atStartOfDay(), weekEnd.plusDays(1).atStartOfDay())
                .stream().filter(WorkoutSession::isFinished).toList();
        double volume = finished.stream().mapToDouble(WorkoutSession::getTotalVolume).sum();

        Map<LocalDate, Integer> caloriesByDay = foodLogs
                .findByUserIdAndDateBetween(user.getId(), weekStart, weekEnd).stream()
                .collect(Collectors.groupingBy(FoodLog::getDate, Collectors.summingInt(FoodLog::getCalories)));
        int daysLogged = caloriesByDay.size();
        int avgCalories = daysLogged == 0 ? 0
                : (int) Math.round(caloriesByDay.values().stream().mapToInt(Integer::intValue).sum() / (double) daysLogged);

        List<BodyMetric> weights = metrics.findByUserIdAndDateBetweenOrderByDateAsc(user.getId(), weekStart, weekEnd);
        Double weightChange = weights.size() < 2 ? null
                : Math.round((weights.get(weights.size() - 1).getWeightKg() - weights.get(0).getWeightKg()) * 10.0) / 10.0;

        int target = Math.max(1, user.getWeeklyWorkoutTarget());
        double workoutPart = Math.min(1.0, finished.size() / (double) target) * 50;
        double loggingPart = Math.min(1.0, daysLogged / 7.0) * 50;

        WeeklySummary s = summaries.findByUserIdAndWeekStart(user.getId(), weekStart).orElseGet(WeeklySummary::new);
        s.setUser(user);
        s.setWeekStart(weekStart);
        s.setWeekEnd(weekEnd);
        s.setWorkoutsCompleted(finished.size());
        s.setTotalVolume(Math.round(volume * 10.0) / 10.0);
        s.setDaysFoodLogged(daysLogged);
        s.setAvgDailyCalories(avgCalories);
        s.setWeightChangeKg(weightChange);
        s.setConsistencyScore((int) Math.round(workoutPart + loggingPart));
        s.setGeneratedAt(clock.now());
        return summaries.save(s);
    }
}
