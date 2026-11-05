package com.fitnessassist.config;

import com.fitnessassist.model.Equipment;
import com.fitnessassist.model.Exercise;
import com.fitnessassist.model.MuscleGroup;
import com.fitnessassist.repository.ExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

import static com.fitnessassist.model.Equipment.*;
import static com.fitnessassist.model.MuscleGroup.*;

/** Seeds the exercise library on first start. */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ExerciseRepository exercises;

    @Override
    public void run(String... args) {
        if (exercises.count() > 0) {
            return;
        }
        exercises.saveAll(List.of(
                ex("Barbell Bench Press", CHEST, BARBELL, "Flat bench press with a barbell; main chest strength lift."),
                ex("Incline Dumbbell Press", CHEST, DUMBBELL, "Press on a 30 degree incline to target the upper chest."),
                ex("Push-Up", CHEST, BODYWEIGHT, "Bodyweight press; keep the body in a straight line."),
                ex("Cable Fly", CHEST, CABLE, "Cable crossover to squeeze the chest through a full range."),
                ex("Pec Deck", CHEST, MACHINE, "Machine fly for chest isolation."),

                ex("Deadlift", BACK, BARBELL, "Hinge from the floor; works the whole posterior chain."),
                ex("Pull-Up", BACK, BODYWEIGHT, "Overhand-grip vertical pull."),
                ex("Barbell Row", BACK, BARBELL, "Bent-over row for back thickness."),
                ex("Lat Pulldown", BACK, MACHINE, "Vertical pull on a cable stack."),
                ex("Seated Cable Row", BACK, CABLE, "Horizontal pull; keep the chest tall."),
                ex("One-Arm Dumbbell Row", BACK, DUMBBELL, "Supported single-arm row."),

                ex("Overhead Press", SHOULDERS, BARBELL, "Standing barbell press overhead."),
                ex("Dumbbell Lateral Raise", SHOULDERS, DUMBBELL, "Raise to the side for the lateral delts."),
                ex("Face Pull", SHOULDERS, CABLE, "Rear delt and upper back work."),
                ex("Arnold Press", SHOULDERS, DUMBBELL, "Rotating dumbbell press."),

                ex("Barbell Curl", BICEPS, BARBELL, "Standing curl with a straight bar."),
                ex("Hammer Curl", BICEPS, DUMBBELL, "Neutral-grip curl; also hits the forearms."),
                ex("Cable Curl", BICEPS, CABLE, "Constant-tension curl."),

                ex("Triceps Pushdown", TRICEPS, CABLE, "Press down on a rope or bar."),
                ex("Skull Crusher", TRICEPS, BARBELL, "Lying triceps extension."),
                ex("Bench Dip", TRICEPS, BODYWEIGHT, "Dips using a bench."),

                ex("Back Squat", QUADS, BARBELL, "Barbell on the upper back; squat to depth."),
                ex("Leg Press", QUADS, MACHINE, "Machine press for quad volume."),
                ex("Goblet Squat", QUADS, KETTLEBELL, "Squat holding a weight at the chest."),
                ex("Walking Lunge", QUADS, DUMBBELL, "Alternating lunges with dumbbells."),

                ex("Romanian Deadlift", HAMSTRINGS, BARBELL, "Hip hinge with soft knees."),
                ex("Lying Leg Curl", HAMSTRINGS, MACHINE, "Hamstring curl on a machine."),

                ex("Hip Thrust", GLUTES, BARBELL, "Drive the hips up with upper back on a bench."),
                ex("Glute Bridge", GLUTES, BODYWEIGHT, "Floor bridge for glute activation."),

                ex("Standing Calf Raise", CALVES, MACHINE, "Raise onto toes under load."),

                ex("Plank", CORE, BODYWEIGHT, "Isometric hold; keep the hips level."),
                ex("Hanging Leg Raise", CORE, BODYWEIGHT, "Raise the legs from a dead hang."),
                ex("Cable Crunch", CORE, CABLE, "Kneeling weighted crunch."),

                ex("Kettlebell Swing", FULL_BODY, KETTLEBELL, "Explosive hip hinge."),
                ex("Burpee", FULL_BODY, BODYWEIGHT, "Squat thrust into a jump."),
                ex("Treadmill Run", CARDIO, MACHINE, "Steady or interval running."),
                ex("Rowing Machine", CARDIO, MACHINE, "Full-body low-impact cardio.")
        ));
    }

    private static Exercise ex(String name, MuscleGroup mg, Equipment eq, String description) {
        return new Exercise(name, mg, eq, description);
    }
}
