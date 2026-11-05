package com.fitnessassist.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/** The calorie/macro allowance for one user on one day; created fresh each midnight by the daily job. */
@Entity
@Table(name = "daily_targets",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "target_date"}))
@Getter
@Setter
@NoArgsConstructor
public class DailyTarget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "target_date", nullable = false)
    private LocalDate date;

    private int calorieTarget;
    private int proteinTargetG;
    private int carbsTargetG;
    private int fatTargetG;

    public DailyTarget(User user, LocalDate date) {
        this.user = user;
        this.date = date;
        copyFrom(user);
    }

    public void copyFrom(User u) {
        this.calorieTarget = u.getDailyCalorieTarget() == null ? 0 : u.getDailyCalorieTarget();
        this.proteinTargetG = u.getProteinTargetG() == null ? 0 : u.getProteinTargetG();
        this.carbsTargetG = u.getCarbsTargetG() == null ? 0 : u.getCarbsTargetG();
        this.fatTargetG = u.getFatTargetG() == null ? 0 : u.getFatTargetG();
    }
}
