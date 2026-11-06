package com.fitnessassist.repository;

import com.fitnessassist.model.WeeklySummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WeeklySummaryRepository extends JpaRepository<WeeklySummary, Long> {
    Optional<WeeklySummary> findByUserIdAndWeekStart(Long userId, LocalDate weekStart);

    List<WeeklySummary> findByUserIdOrderByWeekStartDesc(Long userId);

    List<WeeklySummary> findTop8ByUserIdOrderByWeekStartDesc(Long userId);

    void deleteByUserId(Long userId);

    @Query("select w.user.id as userId, w.consistencyScore as score from WeeklySummary w "
            + "where w.weekStart = (select max(w2.weekStart) from WeeklySummary w2 where w2.user = w.user)")
    List<AdminStats.Score> latestScorePerUser();
}
