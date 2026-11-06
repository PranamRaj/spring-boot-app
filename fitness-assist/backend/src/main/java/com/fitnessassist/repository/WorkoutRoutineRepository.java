package com.fitnessassist.repository;

import com.fitnessassist.model.WorkoutRoutine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkoutRoutineRepository extends JpaRepository<WorkoutRoutine, Long> {
    List<WorkoutRoutine> findByUserIdOrderByIdDesc(Long userId);

    Optional<WorkoutRoutine> findByIdAndUserId(Long id, Long userId);

    void deleteByUserId(Long userId);
}
