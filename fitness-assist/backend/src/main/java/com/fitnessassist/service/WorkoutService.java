package com.fitnessassist.service;

import com.fitnessassist.config.AppClock;
import com.fitnessassist.dto.WorkoutDtos.*;
import com.fitnessassist.exception.BadRequestException;
import com.fitnessassist.exception.ResourceNotFoundException;
import com.fitnessassist.model.*;
import com.fitnessassist.repository.ExerciseRepository;
import com.fitnessassist.repository.WorkoutRoutineRepository;
import com.fitnessassist.repository.WorkoutSessionRepository;
import com.fitnessassist.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WorkoutService {

    private final WorkoutSessionRepository sessions;
    private final WorkoutRoutineRepository routines;
    private final ExerciseRepository exercises;
    private final CurrentUser currentUser;
    private final AppClock clock;

    @Transactional
    public SessionResponse start(StartSessionRequest req) {
        User u = currentUser.get();
        WorkoutSession s = new WorkoutSession();
        s.setUser(u);
        String name = req.name() == null || req.name().isBlank() ? null : req.name().trim();
        if (req.routineId() != null) {
            WorkoutRoutine routine = routines.findByIdAndUserId(req.routineId(), u.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Routine not found"));
            s.setRoutineId(routine.getId());
            if (name == null) {
                name = routine.getName();
            }
        }
        s.setName(name == null ? "Workout" : name);
        s.setStartedAt(clock.now());
        return toResponse(sessions.save(s));
    }

    @Transactional
    public SessionResponse addSet(Long sessionId, AddSetRequest req) {
        WorkoutSession s = owned(sessionId);
        if (s.isFinished()) {
            throw new BadRequestException("This workout is already finished");
        }
        Exercise ex = exercises.findById(req.exerciseId())
                .orElseThrow(() -> new ResourceNotFoundException("Exercise not found"));
        long existing = s.getSets().stream().filter(x -> x.getExercise().getId().equals(ex.getId())).count();

        WorkoutSet set = new WorkoutSet();
        set.setSession(s);
        set.setExercise(ex);
        set.setSetNumber((int) existing + 1);
        set.setReps(req.reps());
        set.setWeightKg(req.weightKg());
        set.setVolume(round(req.reps() * req.weightKg()));
        s.getSets().add(set);
        recomputeTotal(s);
        return toResponse(sessions.save(s));
    }

    @Transactional
    public SessionResponse deleteSet(Long sessionId, Long setId) {
        WorkoutSession s = owned(sessionId);
        if (s.isFinished()) {
            throw new BadRequestException("This workout is already finished");
        }
        boolean removed = s.getSets().removeIf(x -> x.getId().equals(setId));
        if (!removed) {
            throw new ResourceNotFoundException("Set not found");
        }
        // Renumber so set numbers stay 1..n for each exercise.
        Map<Long, Integer> counters = new LinkedHashMap<>();
        for (WorkoutSet x : s.getSets()) {
            x.setSetNumber(counters.merge(x.getExercise().getId(), 1, Integer::sum));
        }
        recomputeTotal(s);
        return toResponse(sessions.save(s));
    }

    @Transactional
    public SessionResponse finish(Long sessionId) {
        WorkoutSession s = owned(sessionId);
        if (s.isFinished()) {
            throw new BadRequestException("This workout is already finished");
        }
        if (s.getSets().isEmpty()) {
            throw new BadRequestException("Log at least one set before finishing");
        }
        s.setFinishedAt(clock.now());
        recomputeTotal(s);
        return toResponse(sessions.save(s));
    }

    @Transactional(readOnly = true)
    public List<SessionResponse> list() {
        return sessions.findByUserIdOrderByStartedAtDesc(currentUser.get().getId())
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public SessionResponse get(Long id) {
        return toResponse(owned(id));
    }

    @Transactional
    public void delete(Long id) {
        sessions.delete(owned(id));
    }

    private WorkoutSession owned(Long id) {
        return sessions.findByIdAndUserId(id, currentUser.get().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Workout not found"));
    }

    private void recomputeTotal(WorkoutSession s) {
        s.setTotalVolume(round(s.getSets().stream().mapToDouble(WorkoutSet::getVolume).sum()));
    }

    private SessionResponse toResponse(WorkoutSession s) {
        List<SetResponse> sets = s.getSets().stream()
                .map(x -> new SetResponse(x.getId(), x.getExercise().getId(), x.getExercise().getName(),
                        x.getSetNumber(), x.getReps(), x.getWeightKg(), x.getVolume()))
                .toList();

        Map<Long, ExerciseVolume> perExercise = new LinkedHashMap<>();
        for (WorkoutSet x : s.getSets()) {
            perExercise.merge(x.getExercise().getId(),
                    new ExerciseVolume(x.getExercise().getId(), x.getExercise().getName(), 1, x.getVolume()),
                    (a, b) -> new ExerciseVolume(a.exerciseId(), a.exerciseName(), a.sets() + 1,
                            round(a.volume() + b.volume())));
        }

        Long minutes = s.isFinished() ? Duration.between(s.getStartedAt(), s.getFinishedAt()).toMinutes() : null;
        return new SessionResponse(s.getId(), s.getName(), s.getRoutineId(), s.getStartedAt(), s.getFinishedAt(),
                s.isFinished(), s.getTotalVolume(), minutes, sets, List.copyOf(perExercise.values()));
    }

    private static double round(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
