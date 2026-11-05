package com.fitnessassist.repository;

import com.fitnessassist.model.WorkoutSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface WorkoutSetRepository extends JpaRepository<WorkoutSet, Long> {

    @Query("select s from WorkoutSet s join fetch s.session ss "
            + "where s.exercise.id = :exerciseId and ss.user.id = :userId order by ss.startedAt")
    List<WorkoutSet> findHistory(@Param("exerciseId") Long exerciseId, @Param("userId") Long userId);
}
