package com.fitnessassist.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "weekly_summaries",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "week_start"}))
@Getter
@Setter
@NoArgsConstructor
public class WeeklySummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "week_start", nullable = false)
    private LocalDate weekStart;

    @Column(name = "week_end", nullable = false)
    private LocalDate weekEnd;

    private int workoutsCompleted;
    private double totalVolume;
    private int daysFoodLogged;
    private int avgDailyCalories;
    private Double weightChangeKg;

    /** 0-100: half from hitting the weekly workout target, half from days with food logged. */
    private int consistencyScore;

    private LocalDateTime generatedAt;
}
