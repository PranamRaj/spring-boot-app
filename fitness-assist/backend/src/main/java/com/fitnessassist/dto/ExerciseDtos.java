package com.fitnessassist.dto;

import com.fitnessassist.model.Equipment;
import com.fitnessassist.model.Exercise;
import com.fitnessassist.model.MuscleGroup;

import java.util.List;

public class ExerciseDtos {

    public record ExerciseResponse(Long id, String name, String description,
                                   MuscleGroup muscleGroup, Equipment equipment) {
        public static ExerciseResponse from(Exercise e) {
            return new ExerciseResponse(e.getId(), e.getName(), e.getDescription(),
                    e.getMuscleGroup(), e.getEquipment());
        }
    }

    public record ExerciseMeta(List<MuscleGroup> muscleGroups, List<Equipment> equipment) {
    }
}
