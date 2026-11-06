package com.fitnessassist.repository;

import com.fitnessassist.model.WorkoutSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface WorkoutSessionRepository extends JpaRepository<WorkoutSession, Long> {
    List<WorkoutSession> findByUserIdOrderByStartedAtDesc(Long userId);

    Optional<WorkoutSession> findByIdAndUserId(Long id, Long userId);

    List<WorkoutSession> findByUserIdAndStartedAtGreaterThanEqualAndStartedAtLessThan(
            Long userId, LocalDateTime from, LocalDateTime to);

    List<WorkoutSession> findTop10ByUserIdOrderByStartedAtDesc(Long userId);

    void deleteByUserId(Long userId);

    @Query("select s.user.id as userId, count(s) as workouts, coalesce(sum(s.totalVolume), 0) as volume, "
            + "max(s.startedAt) as lastAt from WorkoutSession s "
            + "where s.finishedAt is not null and s.startedAt >= :since group by s.user.id")
    List<AdminStats.WorkoutAgg> finishedStatsSince(@Param("since") LocalDateTime since);

    @Query("select s.startedAt from WorkoutSession s where s.finishedAt is not null and s.startedAt >= :since")
    List<LocalDateTime> finishedStartTimesSince(@Param("since") LocalDateTime since);
}
