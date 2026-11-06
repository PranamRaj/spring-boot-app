package com.fitnessassist.repository;

import com.fitnessassist.model.BodyMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BodyMetricRepository extends JpaRepository<BodyMetric, Long> {
    Optional<BodyMetric> findByUserIdAndDate(Long userId, LocalDate date);

    Optional<BodyMetric> findByIdAndUserId(Long id, Long userId);

    List<BodyMetric> findByUserIdAndDateBetweenOrderByDateAsc(Long userId, LocalDate from, LocalDate to);

    List<BodyMetric> findByUserIdOrderByDateAsc(Long userId);

    void deleteByUserId(Long userId);

    @Query("select m.user.id as userId, m.weightKg as weightKg from BodyMetric m "
            + "where m.date = (select min(m2.date) from BodyMetric m2 where m2.user = m.user)")
    List<AdminStats.Weight> firstWeightPerUser();

    @Query("select m.user.id as userId, m.weightKg as weightKg from BodyMetric m "
            + "where m.date = (select max(m2.date) from BodyMetric m2 where m2.user = m.user)")
    List<AdminStats.Weight> latestWeightPerUser();
}
