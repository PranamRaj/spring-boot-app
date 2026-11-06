package com.fitnessassist.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Sex sex;

    @Column(nullable = false)
    private Integer age;

    @Column(nullable = false)
    private Double heightCm;

    @Column(nullable = false)
    private Double weightKg;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActivityLevel activityLevel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FitnessGoal goal;

    private Integer dailyCalorieTarget;
    private Integer proteinTargetG;
    private Integer carbsTargetG;
    private Integer fatTargetG;

    @Column(nullable = false)
    private Integer weeklyWorkoutTarget = 4;

    private LocalDateTime createdAt = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Role role = Role.TRAINEE;

    /** Suspended accounts cannot log in; their data is kept. */
    private Boolean active = true;

    /** Private notes the coach (admin) keeps about this trainee. */
    @Column(length = 2000)
    private String coachNotes;

    // Rows created before these columns existed hold nulls until AdminSeeder backfills them.
    public Role getRole() {
        return role == null ? Role.TRAINEE : role;
    }

    public boolean isActive() {
        return active == null || active;
    }

    public boolean isAdmin() {
        return getRole() == Role.ADMIN;
    }
}
