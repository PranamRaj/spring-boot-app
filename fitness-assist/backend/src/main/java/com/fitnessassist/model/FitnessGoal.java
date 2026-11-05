package com.fitnessassist.model;

public enum FitnessGoal {
    FAT_LOSS(-500, 2.0),
    MUSCLE_GAIN(300, 2.0),
    MAINTENANCE(0, 1.6);

    private final int calorieAdjustment;
    private final double proteinPerKg;

    FitnessGoal(int calorieAdjustment, double proteinPerKg) {
        this.calorieAdjustment = calorieAdjustment;
        this.proteinPerKg = proteinPerKg;
    }

    public int getCalorieAdjustment() {
        return calorieAdjustment;
    }

    public double getProteinPerKg() {
        return proteinPerKg;
    }
}
