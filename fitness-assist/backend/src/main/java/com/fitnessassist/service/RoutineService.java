package com.fitnessassist.service;

import com.fitnessassist.dto.RoutineDtos.*;
import com.fitnessassist.exception.ResourceNotFoundException;
import com.fitnessassist.model.Exercise;
import com.fitnessassist.model.RoutineExercise;
import com.fitnessassist.model.User;
import com.fitnessassist.model.WorkoutRoutine;
import com.fitnessassist.repository.ExerciseRepository;
import com.fitnessassist.repository.WorkoutRoutineRepository;
import com.fitnessassist.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoutineService {

    private final WorkoutRoutineRepository routines;
    private final ExerciseRepository exercises;
    private final CurrentUser currentUser;

    @Transactional(readOnly = true)
    public List<RoutineResponse> list() {
        return routines.findByUserIdOrderByIdDesc(currentUser.get().getId())
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public RoutineResponse get(Long id) {
        return toResponse(owned(id));
    }

    @Transactional
    public RoutineResponse create(RoutineRequest r) {
        User u = currentUser.get();
        WorkoutRoutine routine = new WorkoutRoutine();
        routine.setUser(u);
        apply(routine, r);
        return toResponse(routines.save(routine));
    }

    @Transactional
    public RoutineResponse update(Long id, RoutineRequest r) {
        WorkoutRoutine routine = owned(id);
        routine.getExercises().clear();
        apply(routine, r);
        return toResponse(routines.save(routine));
    }

    @Transactional
    public void delete(Long id) {
        routines.delete(owned(id));
    }

    private WorkoutRoutine owned(Long id) {
        return routines.findByIdAndUserId(id, currentUser.get().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Routine not found"));
    }

    private void apply(WorkoutRoutine routine, RoutineRequest r) {
        routine.setName(r.name().trim());
        routine.setNotes(r.notes());
        int order = 0;
        for (RoutineExerciseRequest item : r.exercises()) {
            Exercise ex = exercises.findById(item.exerciseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Exercise " + item.exerciseId() + " not found"));
            RoutineExercise re = new RoutineExercise();
            re.setRoutine(routine);
            re.setExercise(ex);
            re.setTargetSets(item.targetSets());
            re.setTargetReps(item.targetReps());
            re.setOrderIndex(order++);
            routine.getExercises().add(re);
        }
    }

    private RoutineResponse toResponse(WorkoutRoutine r) {
        List<RoutineExerciseResponse> items = r.getExercises().stream()
                .map(re -> new RoutineExerciseResponse(re.getId(), re.getExercise().getId(),
                        re.getExercise().getName(), re.getExercise().getMuscleGroup(),
                        re.getTargetSets(), re.getTargetReps(), re.getOrderIndex()))
                .toList();
        return new RoutineResponse(r.getId(), r.getName(), r.getNotes(), items);
    }
}
