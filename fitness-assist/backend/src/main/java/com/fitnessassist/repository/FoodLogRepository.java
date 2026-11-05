package com.fitnessassist.repository;

import com.fitnessassist.model.FoodLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface FoodLogRepository extends JpaRepository<FoodLog, Long> {
    List<FoodLog> findByUserIdAndDateOrderByIdAsc(Long userId, LocalDate date);

    List<FoodLog> findByUserIdAndDateBetween(Long userId, LocalDate from, LocalDate to);

    Optional<FoodLog> findByIdAndUserId(Long id, Long userId);
}
