package com.fitnessassist.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "food_logs")
@Getter
@Setter
@NoArgsConstructor
public class FoodLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "log_date", nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MealType mealType;

    @Column(nullable = false)
    private String foodName;

    @Column(nullable = false)
    private int calories;

    @Column(nullable = false)
    private double proteinG;

    @Column(nullable = false)
    private double carbsG;

    @Column(nullable = false)
    private double fatG;
}
