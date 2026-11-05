package com.fitnessassist.repository;

import com.fitnessassist.model.WeeklySummary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WeeklySummaryRepository extends JpaRepository<WeeklySummary, Long> {
    Optional<WeeklySummary> findByUserIdAndWeekStart(Long userId, LocalDate weekStart);

    List<WeeklySummary> findByUserIdOrderByWeekStartDesc(Long userId);
}
