package com.fitnessassist.repository;

import com.fitnessassist.model.DailyTarget;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface DailyTargetRepository extends JpaRepository<DailyTarget, Long> {
    Optional<DailyTarget> findByUserIdAndDate(Long userId, LocalDate date);
}
