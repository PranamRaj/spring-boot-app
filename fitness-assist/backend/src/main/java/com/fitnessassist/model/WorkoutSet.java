package com.fitnessassist.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "workout_sets")
@Getter
@Setter
@NoArgsConstructor
public class WorkoutSet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id")
    private WorkoutSession session;

    @ManyToOne(optional = false)
    @JoinColumn(name = "exercise_id")
    private Exercise exercise;

    @Column(nullable = false)
    private int setNumber;

    @Column(nullable = false)
    private int reps;

    @Column(nullable = false)
    private double weightKg;

    /** reps x weightKg, computed once when the set is logged. */
    @Column(nullable = false)
    private double volume;
}
