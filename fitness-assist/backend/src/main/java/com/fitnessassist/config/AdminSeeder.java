package com.fitnessassist.config;

import com.fitnessassist.model.*;
import com.fitnessassist.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Backfills role/active on accounts created before those columns existed, and creates the first
 * admin account if there is none. Credentials come from app.admin.* (ADMIN_EMAIL / ADMIN_PASSWORD).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String email;

    @Value("${app.admin.password}")
    private String password;

    @Value("${app.admin.name}")
    private String name;

    @Override
    @Transactional
    public void run(String... args) {
        int roles = users.backfillRole(Role.TRAINEE);
        int active = users.backfillActive();
        if (roles + active > 0) {
            log.info("Backfilled role on {} and active flag on {} existing accounts", roles, active);
        }

        if (users.existsByRole(Role.ADMIN)) {
            return;
        }
        String adminEmail = email.trim().toLowerCase();
        User admin = users.findByEmail(adminEmail).orElseGet(() -> {
            User u = new User();
            u.setName(name);
            u.setEmail(adminEmail);
            // Profile columns are required; an admin does not train, so these are placeholders.
            u.setSex(Sex.OTHER);
            u.setAge(30);
            u.setHeightCm(170.0);
            u.setWeightKg(70.0);
            u.setActivityLevel(ActivityLevel.MODERATE);
            u.setGoal(FitnessGoal.MAINTENANCE);
            return u;
        });
        admin.setPassword(passwordEncoder.encode(password));
        admin.setRole(Role.ADMIN);
        admin.setActive(true);
        users.save(admin);
        log.warn("Created admin account {} - set app.admin.password (ADMIN_PASSWORD) outside local development",
                adminEmail);
    }
}
