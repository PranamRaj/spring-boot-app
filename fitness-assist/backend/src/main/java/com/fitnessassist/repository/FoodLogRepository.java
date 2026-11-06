package com.fitnessassist.repository;

import com.fitnessassist.model.FoodLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface FoodLogRepository extends JpaRepository<FoodLog, Long> {
    List<FoodLog> findByUserIdAndDateOrderByIdAsc(Long userId, LocalDate date);

    List<FoodLog> findByUserIdAndDateBetween(Long userId, LocalDate from, LocalDate to);

    Optional<FoodLog> findByIdAndUserId(Long id, Long userId);

    void deleteByUserId(Long userId);

    @Query("select f.user.id as userId, max(f.date) as lastDate from FoodLog f group by f.user.id")
    List<AdminStats.LastDate> lastLogDatePerUser();
}
