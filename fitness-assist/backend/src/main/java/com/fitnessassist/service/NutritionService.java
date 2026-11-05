package com.fitnessassist.service;

import com.fitnessassist.config.AppClock;
import com.fitnessassist.dto.NutritionDtos.*;
import com.fitnessassist.exception.ResourceNotFoundException;
import com.fitnessassist.model.DailyTarget;
import com.fitnessassist.model.FoodLog;
import com.fitnessassist.model.User;
import com.fitnessassist.repository.DailyTargetRepository;
import com.fitnessassist.repository.FoodLogRepository;
import com.fitnessassist.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NutritionService {

    private final FoodLogRepository foodLogs;
    private final DailyTargetRepository dailyTargets;
    private final CurrentUser currentUser;
    private final AppClock clock;

    @Transactional
    public FoodLogResponse add(FoodLogRequest r) {
        User u = currentUser.get();
        FoodLog f = new FoodLog();
        f.setUser(u);
        f.setDate(r.date() == null ? clock.today() : r.date());
        f.setMealType(r.mealType());
        f.setFoodName(r.foodName().trim());
        f.setCalories(r.calories());
        f.setProteinG(r.proteinG());
        f.setCarbsG(r.carbsG());
        f.setFatG(r.fatG());
        return toResponse(foodLogs.save(f));
    }

    @Transactional
    public void delete(Long id) {
        FoodLog f = foodLogs.findByIdAndUserId(id, currentUser.get().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Food entry not found"));
        foodLogs.delete(f);
    }

    @Transactional
    public DailyNutritionResponse daily(LocalDate date) {
        User u = currentUser.get();
        LocalDate day = date == null ? clock.today() : date;
        DailyTarget target = ensureTarget(u, day);
        List<FoodLog> entries = foodLogs.findByUserIdAndDateOrderByIdAsc(u.getId(), day);

        int cal = entries.stream().mapToInt(FoodLog::getCalories).sum();
        double p = round(entries.stream().mapToDouble(FoodLog::getProteinG).sum());
        double c = round(entries.stream().mapToDouble(FoodLog::getCarbsG).sum());
        double f = round(entries.stream().mapToDouble(FoodLog::getFatG).sum());

        MacroTotals targetTotals = new MacroTotals(target.getCalorieTarget(), target.getProteinTargetG(),
                target.getCarbsTargetG(), target.getFatTargetG());
        MacroTotals consumed = new MacroTotals(cal, p, c, f);
        // Remaining calories can go negative; the UI shows that as "over target".
        MacroTotals remaining = new MacroTotals(target.getCalorieTarget() - cal,
                round(target.getProteinTargetG() - p), round(target.getCarbsTargetG() - c),
                round(target.getFatTargetG() - f));

        return new DailyNutritionResponse(day, targetTotals, consumed, remaining,
                cal > target.getCalorieTarget(), entries.stream().map(this::toResponse).toList());
    }

    /** Returns the day's allowance, creating it from the user's current targets if it doesn't exist yet. */
    @Transactional
    public DailyTarget ensureTarget(User user, LocalDate date) {
        return dailyTargets.findByUserIdAndDate(user.getId(), date)
                .orElseGet(() -> dailyTargets.save(new DailyTarget(user, date)));
    }

    /** Called when the profile changes so today's allowance follows the new goal immediately. */
    @Transactional
    public void refreshToday(User user) {
        DailyTarget t = ensureTarget(user, clock.today());
        t.copyFrom(user);
        dailyTargets.save(t);
    }

    private FoodLogResponse toResponse(FoodLog f) {
        return new FoodLogResponse(f.getId(), f.getDate(), f.getMealType(), f.getFoodName(),
                f.getCalories(), f.getProteinG(), f.getCarbsG(), f.getFatG());
    }

    private static double round(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
