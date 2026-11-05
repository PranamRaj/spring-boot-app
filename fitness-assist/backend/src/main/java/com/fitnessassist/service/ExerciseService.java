package com.fitnessassist.service;

import com.fitnessassist.dto.ExerciseDtos.ExerciseMeta;
import com.fitnessassist.dto.ExerciseDtos.ExerciseResponse;
import com.fitnessassist.exception.ResourceNotFoundException;
import com.fitnessassist.model.Equipment;
import com.fitnessassist.model.MuscleGroup;
import com.fitnessassist.repository.ExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExerciseService {

    private final ExerciseRepository exercises;

    /** The catalog is small, so filtering in memory keeps the query layer simple and DB-agnostic. */
    public List<ExerciseResponse> search(MuscleGroup muscleGroup, Equipment equipment, String q) {
        String needle = q == null ? null : q.trim().toLowerCase();
        return exercises.findAll(Sort.by("name")).stream()
                .filter(e -> muscleGroup == null || e.getMuscleGroup() == muscleGroup)
                .filter(e -> equipment == null || e.getEquipment() == equipment)
                .filter(e -> needle == null || needle.isEmpty() || e.getName().toLowerCase().contains(needle))
                .map(ExerciseResponse::from)
                .toList();
    }

    public ExerciseResponse get(Long id) {
        return exercises.findById(id)
                .map(ExerciseResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Exercise not found"));
    }

    public ExerciseMeta meta() {
        return new ExerciseMeta(Arrays.asList(MuscleGroup.values()), Arrays.asList(Equipment.values()));
    }
}
