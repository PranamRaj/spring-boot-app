package com.fitnessassist.util;

import com.fitnessassist.model.User;

/** Mifflin-St Jeor BMR x activity multiplier, adjusted for the user's goal, then split into macros. */
public final class NutritionPlanner {

    private NutritionPlanner() {
    }

    public record Targets(int calories, int proteinG, int carbsG, int fatG) {
    }

    public static Targets compute(User u) {
        double weight = u.getWeightKg();
        double base = 10 * weight + 6.25 * u.getHeightCm() - 5 * u.getAge();
        double bmr = switch (u.getSex()) {
            case MALE -> base + 5;
            case FEMALE -> base - 161;
            case OTHER -> base - 78;
        };
        double tdee = bmr * u.getActivityLevel().getMultiplier();
        int calories = (int) Math.round(Math.max(1200, tdee + u.getGoal().getCalorieAdjustment()));

        int protein = (int) Math.round(weight * u.getGoal().getProteinPerKg());
        int fat = (int) Math.round(calories * 0.25 / 9);
        int carbs = (int) Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4.0));
        return new Targets(calories, protein, carbs, fat);
    }
}
