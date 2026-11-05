package com.fitnessassist.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "body_metrics",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "metric_date"}))
@Getter
@Setter
@NoArgsConstructor
public class BodyMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "metric_date", nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private double weightKg;

    private Double waistCm;
    private Double chestCm;
    private Double hipsCm;
    private Double armCm;
    private Double thighCm;
}
