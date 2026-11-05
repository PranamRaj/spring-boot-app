package com.fitnessassist.service;

import com.fitnessassist.config.AppClock;
import com.fitnessassist.dto.ProgressDtos.*;
import com.fitnessassist.exception.ResourceNotFoundException;
import com.fitnessassist.model.BodyMetric;
import com.fitnessassist.model.Exercise;
import com.fitnessassist.model.User;
import com.fitnessassist.model.WorkoutSession;
import com.fitnessassist.model.WorkoutSet;
import com.fitnessassist.repository.BodyMetricRepository;
import com.fitnessassist.repository.ExerciseRepository;
import com.fitnessassist.repository.WorkoutSessionRepository;
import com.fitnessassist.repository.WorkoutSetRepository;
import com.fitnessassist.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProgressService {

    private final BodyMetricRepository metrics;
    private final WorkoutSetRepository sets;
    private final WorkoutSessionRepository sessions;
    private final ExerciseRepository exercises;
    private final CurrentUser currentUser;
    private final AppClock clock;

    public WeightTrend weight(int days) {
        User u = currentUser.get();
        LocalDate end = clock.today();
        List<BodyMetric> rows = metrics.findByUserIdAndDateBetweenOrderByDateAsc(
                u.getId(), end.minusDays(days), end);
        List<WeightPoint> points = rows.stream().map(m -> new WeightPoint(m.getDate(), m.getWeightKg())).toList();
        if (points.isEmpty()) {
            return new WeightTrend(points, null, null, null);
        }
        double start = points.get(0).weightKg();
        double latest = points.get(points.size() - 1).weightKg();
        return new WeightTrend(points, start, latest, Math.round((latest - start) * 10.0) / 10.0);
    }

    /** Per workout day: heaviest set, best estimated one-rep max (Epley), and total volume for the lift. */
    public StrengthTrend strength(Long exerciseId) {
        User u = currentUser.get();
        Exercise ex = exercises.findById(exerciseId)
                .orElseThrow(() -> new ResourceNotFoundException("Exercise not found"));

        Map<LocalDate, double[]> byDay = new TreeMap<>(); // [maxWeight, best1RM, volume]
        for (WorkoutSet s : sets.findHistory(exerciseId, u.getId())) {
            LocalDate day = s.getSession().getStartedAt().toLocalDate();
            double[] agg = byDay.computeIfAbsent(day, d -> new double[3]);
            agg[0] = Math.max(agg[0], s.getWeightKg());
            agg[1] = Math.max(agg[1], s.getWeightKg() * (1 + s.getReps() / 30.0));
            agg[2] += s.getVolume();
        }
        List<StrengthPoint> points = byDay.entrySet().stream()
                .map(e -> new StrengthPoint(e.getKey(), r1(e.getValue()[0]), r1(e.getValue()[1]), r1(e.getValue()[2])))
                .toList();
        return new StrengthTrend(ex.getId(), ex.getName(), points);
    }

    /** Training volume per week (weeks start on Monday) over the last N weeks, finished workouts only. */
    public List<VolumePoint> weeklyVolume(int weeks) {
        User u = currentUser.get();
        LocalDate thisMonday = clock.today().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate first = thisMonday.minusWeeks(weeks - 1L);

        Map<LocalDate, double[]> buckets = new LinkedHashMap<>(); // [volume, sessions]
        for (LocalDate w = first; !w.isAfter(thisMonday); w = w.plusWeeks(1)) {
            buckets.put(w, new double[2]);
        }
        List<WorkoutSession> found = sessions.findByUserIdAndStartedAtGreaterThanEqualAndStartedAtLessThan(
                u.getId(), first.atStartOfDay(), thisMonday.plusWeeks(1).atStartOfDay());
        for (WorkoutSession s : found) {
            if (!s.isFinished()) {
                continue;
            }
            LocalDate monday = s.getStartedAt().toLocalDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            double[] b = buckets.get(monday);
            if (b != null) {
                b[0] += s.getTotalVolume();
                b[1] += 1;
            }
        }
        return buckets.entrySet().stream()
                .map(e -> new VolumePoint(e.getKey(), r1(e.getValue()[0]), (int) e.getValue()[1]))
                .toList();
    }

    private static double r1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
