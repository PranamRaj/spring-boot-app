package com.fitnessassist.repository;

import com.fitnessassist.model.BodyMetric;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BodyMetricRepository extends JpaRepository<BodyMetric, Long> {
    Optional<BodyMetric> findByUserIdAndDate(Long userId, LocalDate date);

    Optional<BodyMetric> findByIdAndUserId(Long id, Long userId);

    List<BodyMetric> findByUserIdAndDateBetweenOrderByDateAsc(Long userId, LocalDate from, LocalDate to);
}
