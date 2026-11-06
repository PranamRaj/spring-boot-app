package com.fitnessassist.service;

import com.fitnessassist.config.AppClock;
import com.fitnessassist.dto.AuthDtos.AuthResponse;
import com.fitnessassist.dto.AuthDtos.LoginRequest;
import com.fitnessassist.dto.AuthDtos.RegisterRequest;
import com.fitnessassist.dto.ProfileDtos.ProfileResponse;
import com.fitnessassist.exception.ConflictException;
import com.fitnessassist.exception.ResourceNotFoundException;
import com.fitnessassist.model.BodyMetric;
import com.fitnessassist.model.User;
import com.fitnessassist.repository.BodyMetricRepository;
import com.fitnessassist.repository.UserRepository;
import com.fitnessassist.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository users;
    private final BodyMetricRepository metrics;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserService userService;
    private final AppClock clock;

    @Transactional
    public AuthResponse register(RegisterRequest r) {
        User u = createTrainee(r);
        return new AuthResponse(jwtService.generateToken(u.getEmail()), ProfileResponse.from(u));
    }

    /** Creates a trainee account with targets and a first weigh-in. Shared by sign-up and the admin dashboard. */
    @Transactional
    public User createTrainee(RegisterRequest r) {
        String email = r.email().trim().toLowerCase();
        if (users.existsByEmail(email)) {
            throw new ConflictException("An account with this email already exists");
        }
        User u = new User();
        u.setName(r.name().trim());
        u.setEmail(email);
        u.setPassword(passwordEncoder.encode(r.password()));
        u.setSex(r.sex());
        u.setAge(r.age());
        u.setHeightCm(r.heightCm());
        u.setWeightKg(r.weightKg());
        u.setActivityLevel(r.activityLevel());
        u.setGoal(r.goal());
        userService.applyTargets(u);
        users.save(u);

        // Starting weight becomes the first point on the progress chart.
        BodyMetric first = new BodyMetric();
        first.setUser(u);
        first.setDate(clock.today());
        first.setWeightKg(u.getWeightKg());
        metrics.save(first);
        return u;
    }

    public AuthResponse login(LoginRequest r) {
        String email = r.email().trim().toLowerCase();
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, r.password()));
        User u = users.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return new AuthResponse(jwtService.generateToken(email), ProfileResponse.from(u));
    }
}
