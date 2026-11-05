package com.fitnessassist.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "exercises")
@Getter
@Setter
@NoArgsConstructor
public class Exercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MuscleGroup muscleGroup;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Equipment equipment;

    public Exercise(String name, MuscleGroup muscleGroup, Equipment equipment, String description) {
        this.name = name;
        this.muscleGroup = muscleGroup;
        this.equipment = equipment;
        this.description = description;
    }
}
