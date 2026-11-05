package com.fitnessassist.service;

import com.fitnessassist.model.User;
import com.fitnessassist.util.NutritionPlanner;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    /** Recomputes the user's calorie and macro targets from their current profile. */
    public void applyTargets(User u) {
        NutritionPlanner.Targets t = NutritionPlanner.compute(u);
        u.setDailyCalorieTarget(t.calories());
        u.setProteinTargetG(t.proteinG());
        u.setCarbsTargetG(t.carbsG());
        u.setFatTargetG(t.fatG());
    }
}
