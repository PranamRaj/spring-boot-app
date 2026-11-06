package com.fitnessassist.service.data;

import com.fitnessassist.exception.BadRequestException;
import com.fitnessassist.model.*;
import com.fitnessassist.security.CurrentUser;
import com.fitnessassist.service.AdminService;
import com.fitnessassist.service.NutritionService;
import com.fitnessassist.service.UserService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import static com.fitnessassist.service.data.FieldDef.*;

/**
 * Every table the admin can manage, with its columns and the business rules that must hold
 * when rows are written outside the normal app flow (password hashing, recalculated targets,
 * set volume and session totals, never locking yourself out).
 */
@Component
public class DataResources {

    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("d MMM yyyy");

    @PersistenceContext
    private EntityManager em;

    private final UserService userService;
    private final NutritionService nutritionService;
    private final AdminService adminService;
    private final CurrentUser currentUser;
    private final Map<String, Resource> byKey = new LinkedHashMap<>();

    public DataResources(UserService userService, NutritionService nutritionService, @Lazy AdminService adminService,
                         CurrentUser currentUser) {
        this.userService = userService;
        this.nutritionService = nutritionService;
        this.adminService = adminService;
        this.currentUser = currentUser;
        register();
    }

    public List<Resource> all() {
        return List.copyOf(byKey.values());
    }

    public Resource get(String key) {
        Resource r = byKey.get(key);
        if (r == null) {
            throw new com.fitnessassist.exception.ResourceNotFoundException("Unknown table: " + key);
        }
        return r;
    }

    private void add(Resource r) {
        byKey.put(r.getKey(), r);
    }

    private void register() {
        /* ------------------------------------------------------------ people */
        add(new Resource("users", "Users", "People", "Trainee and admin accounts.", User.class, List.of(
                string("name", "Name").required(),
                string("email", "Email").required(),
                password("password", "Password").hint("Leave blank to keep the current password."),
                enumOf("role", "Role", Role.class).required(),
                bool("active", "Active").hint("Inactive accounts cannot log in."),
                enumOf("sex", "Sex", Sex.class).required().hidden(),
                integer("age", "Age").required().range(10, 100).hidden(),
                decimal("heightCm", "Height (cm)").required().range(100, 250).hidden(),
                decimal("weightKg", "Weight (kg)").required().range(30, 400),
                enumOf("activityLevel", "Activity level", ActivityLevel.class).required().hidden(),
                enumOf("goal", "Goal", FitnessGoal.class).required(),
                integer("weeklyWorkoutTarget", "Workouts / week").required().range(1, 14).hidden(),
                integer("dailyCalorieTarget", "Calorie target").readOnly().hint("Recalculated from the profile on save."),
                integer("proteinTargetG", "Protein target (g)").readOnly().hidden(),
                integer("carbsTargetG", "Carbs target (g)").readOnly().hidden(),
                integer("fatTargetG", "Fat target (g)").readOnly().hidden(),
                text("coachNotes", "Coach notes", 2000),
                dateTime("createdAt", "Created").readOnly()))
                .labeler(e -> EntityAccess.read(e, "name") + " · " + EntityAccess.read(e, "email"))
                .beforeSave((e, create) -> {
                    User u = (User) e;
                    u.setEmail(u.getEmail().trim().toLowerCase());
                    User me = currentUser.get();
                    if (!create && Objects.equals(u.getId(), me.getId()) && (!u.isAdmin() || !u.isActive())) {
                        throw new BadRequestException("You cannot remove your own admin role or deactivate yourself");
                    }
                    userService.applyTargets(u);
                })
                .afterChange((e, deleted) -> {
                    User u = (User) e;
                    if (!deleted) nutritionService.refreshToday(u);
                })
                .deleter(e -> {
                    User u = (User) e;
                    if (Objects.equals(u.getId(), currentUser.get().getId())) {
                        throw new BadRequestException("You cannot delete your own account");
                    }
                    adminService.purge(u);
                }));

        /* ----------------------------------------------------------- library */
        add(new Resource("exercises", "Exercises", "Library", "The shared exercise library.", Exercise.class, List.of(
                string("name", "Name").required().maxLength(255),
                enumOf("muscleGroup", "Muscle group", MuscleGroup.class).required(),
                enumOf("equipment", "Equipment", Equipment.class).required(),
                text("description", "Description", 1000)))
                .labeler(e -> String.valueOf(EntityAccess.read(e, "name"))));

        /* ---------------------------------------------------------- training */
        add(new Resource("routines", "Routines", "Training", "Saved workout plans.", WorkoutRoutine.class, List.of(
                ref("user", "User", "users").required(),
                string("name", "Name").required().maxLength(255),
                text("notes", "Notes", 1000)))
                .labeler(e -> String.valueOf(EntityAccess.read(e, "name"))));

        add(new Resource("routineExercises", "Routine exercises", "Training", "Exercises inside a routine.",
                RoutineExercise.class, List.of(
                ref("routine", "Routine", "routines").required().createOnly(),
                ref("exercise", "Exercise", "exercises").required(),
                integer("targetSets", "Sets").required().range(1, 50),
                integer("targetReps", "Reps").required().range(1, 1000),
                integer("orderIndex", "Order").required().min(0))));

        add(new Resource("workoutSessions", "Workout sessions", "Training", "Logged workouts.", WorkoutSession.class, List.of(
                ref("user", "User", "users").required(),
                string("name", "Name").required().maxLength(255),
                dateTime("startedAt", "Started").required(),
                dateTime("finishedAt", "Finished").hint("Leave empty if the workout is still in progress."),
                decimal("totalVolume", "Volume (kg)").readOnly().hint("Sum of the session's sets."),
                integer("routineId", "Routine id").hidden()))
                .labeler(e -> {
                    WorkoutSession s = (WorkoutSession) org.hibernate.Hibernate.unproxy(e);
                    return s.getName() + " · " + s.getStartedAt().toLocalDate().format(DAY);
                })
                .beforeSave((e, create) -> {
                    WorkoutSession s = (WorkoutSession) e;
                    if (s.getFinishedAt() != null && s.getFinishedAt().isBefore(s.getStartedAt())) {
                        throw new BadRequestException("Finished time must be after the start time");
                    }
                }));

        add(new Resource("workoutSets", "Workout sets", "Training", "Individual sets inside a session.", WorkoutSet.class, List.of(
                ref("session", "Session", "workoutSessions").required().createOnly(),
                ref("exercise", "Exercise", "exercises").required(),
                integer("setNumber", "Set #").min(0).hint("Leave 0 to number it automatically."),
                integer("reps", "Reps").required().range(1, 1000),
                decimal("weightKg", "Weight (kg)").required().range(0, 1000),
                decimal("volume", "Volume (kg)").readOnly().hint("Reps × weight.")))
                .beforeSave((e, create) -> {
                    WorkoutSet s = (WorkoutSet) e;
                    s.setVolume(Math.round(s.getReps() * s.getWeightKg() * 10.0) / 10.0);
                    if (s.getSetNumber() <= 0) {
                        Long n = em.createQuery("select count(x) from WorkoutSet x where x.session = :s and x.exercise = :ex",
                                Long.class).setParameter("s", s.getSession()).setParameter("ex", s.getExercise())
                                .getSingleResult();
                        s.setSetNumber((int) (n + (create ? 1 : 0)));
                    }
                })
                // Keep the parent session's total in line with its sets.
                .afterChange((e, deleted) -> recomputeSessionVolume(((WorkoutSet) e).getSession())));

        /* --------------------------------------------------------- nutrition */
        add(new Resource("foodLogs", "Food logs", "Nutrition", "Meals logged by trainees.", FoodLog.class, List.of(
                ref("user", "User", "users").required(),
                date("date", "Date").required(),
                enumOf("mealType", "Meal", MealType.class).required(),
                string("foodName", "Food").required().maxLength(150),
                integer("calories", "kcal").required().range(0, 10000),
                decimal("proteinG", "Protein (g)").required().min(0),
                decimal("carbsG", "Carbs (g)").required().min(0),
                decimal("fatG", "Fat (g)").required().min(0))));

        add(new Resource("dailyTargets", "Daily targets", "Nutrition", "Each user's calorie/macro allowance per day.",
                DailyTarget.class, List.of(
                ref("user", "User", "users").required(),
                date("date", "Date").required(),
                integer("calorieTarget", "kcal").required().min(0),
                integer("proteinTargetG", "Protein (g)").required().min(0),
                integer("carbsTargetG", "Carbs (g)").required().min(0),
                integer("fatTargetG", "Fat (g)").required().min(0))));

        /* ---------------------------------------------------------- progress */
        add(new Resource("bodyMetrics", "Body metrics", "Progress", "Weigh-ins and measurements (one per user per day).",
                BodyMetric.class, List.of(
                ref("user", "User", "users").required(),
                date("date", "Date").required(),
                decimal("weightKg", "Weight (kg)").required().range(20, 400),
                decimal("waistCm", "Waist (cm)").min(0),
                decimal("chestCm", "Chest (cm)").min(0),
                decimal("hipsCm", "Hips (cm)").min(0),
                decimal("armCm", "Arm (cm)").min(0).hidden(),
                decimal("thighCm", "Thigh (cm)").min(0).hidden())));

        add(new Resource("weeklySummaries", "Weekly summaries", "Progress", "Generated weekly consistency reports.",
                WeeklySummary.class, List.of(
                ref("user", "User", "users").required(),
                date("weekStart", "Week start").required(),
                date("weekEnd", "Week end").required(),
                integer("workoutsCompleted", "Workouts").required().min(0),
                decimal("totalVolume", "Volume (kg)").required().min(0),
                integer("daysFoodLogged", "Days logged").required().range(0, 7),
                integer("avgDailyCalories", "Avg kcal").required().min(0),
                decimal("weightChangeKg", "Weight Δ (kg)"),
                integer("consistencyScore", "Score").required().range(0, 100),
                dateTime("generatedAt", "Generated").hidden())));
    }

    private void recomputeSessionVolume(WorkoutSession session) {
        Double total = em.createQuery("select coalesce(sum(x.volume), 0) from WorkoutSet x where x.session = :s", Double.class)
                .setParameter("s", session).getSingleResult();
        WorkoutSession s = em.find(WorkoutSession.class, session.getId());
        if (s != null) {
            s.setTotalVolume(Math.round(total * 10.0) / 10.0);
        }
    }
}
