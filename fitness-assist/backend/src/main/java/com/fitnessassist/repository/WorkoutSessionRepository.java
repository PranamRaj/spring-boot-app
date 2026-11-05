package com.fitnessassist.repository;

import com.fitnessassist.model.WorkoutSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface WorkoutSessionRepository extends JpaRepository<WorkoutSession, Long> {
    List<WorkoutSession> findByUserIdOrderByStartedAtDesc(Long userId);

    Optional<WorkoutSession> findByIdAndUserId(Long id, Long userId);

    List<WorkoutSession> findByUserIdAndStartedAtGreaterThanEqualAndStartedAtLessThan(
            Long userId, LocalDateTime from, LocalDateTime to);
}
