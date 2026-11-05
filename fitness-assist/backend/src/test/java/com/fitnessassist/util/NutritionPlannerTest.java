package com.fitnessassist.util;

import com.fitnessassist.model.ActivityLevel;
import com.fitnessassist.model.FitnessGoal;
import com.fitnessassist.model.Sex;
import com.fitnessassist.model.User;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NutritionPlannerTest {

    private User user(Sex sex, FitnessGoal goal) {
        User u = new User();
        u.setSex(sex);
        u.setAge(30);
        u.setHeightCm(175.0);
        u.setWeightKg(75.0);
        u.setActivityLevel(ActivityLevel.MODERATE);
        u.setGoal(goal);
        return u;
    }

    @Test
    void maintenanceMatchesMifflinStJeor() {
        // BMR = 10*75 + 6.25*175 - 5*30 + 5 = 1698.75; x1.55 = 2633.0
        NutritionPlanner.Targets t = NutritionPlanner.compute(user(Sex.MALE, FitnessGoal.MAINTENANCE));
        assertEquals(2633, t.calories());
        assertEquals(120, t.proteinG()); // 1.6 g/kg
    }

    @Test
    void goalShiftsCaloriesFromMaintenance() {
        int maintain = NutritionPlanner.compute(user(Sex.MALE, FitnessGoal.MAINTENANCE)).calories();
        assertEquals(maintain - 500, NutritionPlanner.compute(user(Sex.MALE, FitnessGoal.FAT_LOSS)).calories());
        assertEquals(maintain + 300, NutritionPlanner.compute(user(Sex.MALE, FitnessGoal.MUSCLE_GAIN)).calories());
    }

    @Test
    void macrosAccountForTargetCalories() {
        NutritionPlanner.Targets t = NutritionPlanner.compute(user(Sex.FEMALE, FitnessGoal.FAT_LOSS));
        int fromMacros = t.proteinG() * 4 + t.carbsG() * 4 + t.fatG() * 9;
        assertTrue(Math.abs(fromMacros - t.calories()) <= 10, "macros should add up to the calorie target");
    }
}
