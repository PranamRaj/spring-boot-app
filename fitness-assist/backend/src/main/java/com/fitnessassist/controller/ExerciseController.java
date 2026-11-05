package com.fitnessassist.controller;

import com.fitnessassist.dto.ExerciseDtos.ExerciseMeta;
import com.fitnessassist.dto.ExerciseDtos.ExerciseResponse;
import com.fitnessassist.model.Equipment;
import com.fitnessassist.model.MuscleGroup;
import com.fitnessassist.service.ExerciseService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exercises")
@RequiredArgsConstructor
@Tag(name = "Exercises")
public class ExerciseController {

    private final ExerciseService exerciseService;

    @GetMapping
    public List<ExerciseResponse> search(@RequestParam(required = false) MuscleGroup muscleGroup,
                                         @RequestParam(required = false) Equipment equipment,
                                         @RequestParam(required = false) String q) {
        return exerciseService.search(muscleGroup, equipment, q);
    }

    @GetMapping("/meta")
    public ExerciseMeta meta() {
        return exerciseService.meta();
    }

    @GetMapping("/{id}")
    public ExerciseResponse get(@PathVariable Long id) {
        return exerciseService.get(id);
    }
}
