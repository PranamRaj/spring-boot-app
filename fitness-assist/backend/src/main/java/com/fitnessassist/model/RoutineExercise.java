package com.fitnessassist.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "routine_exercises")
@Getter
@Setter
@NoArgsConstructor
public class RoutineExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "routine_id")
    private WorkoutRoutine routine;

    @ManyToOne(optional = false)
    @JoinColumn(name = "exercise_id")
    private Exercise exercise;

    @Column(nullable = false)
    private int targetSets;

    @Column(nullable = false)
    private int targetReps;

    @Column(nullable = false)
    private int orderIndex;
}
