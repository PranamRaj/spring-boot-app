package com.fitnessassist.service;

import com.fitnessassist.dto.ProfileDtos.ProfileResponse;
import com.fitnessassist.dto.ProfileDtos.UpdateProfileRequest;
import com.fitnessassist.model.User;
import com.fitnessassist.repository.UserRepository;
import com.fitnessassist.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final CurrentUser currentUser;
    private final UserRepository users;
    private final UserService userService;
    private final NutritionService nutritionService;

    @Transactional(readOnly = true)
    public ProfileResponse get() {
        return ProfileResponse.from(currentUser.get());
    }

    @Transactional
    public ProfileResponse update(UpdateProfileRequest r) {
        User u = currentUser.get();
        u.setName(r.name().trim());
        u.setSex(r.sex());
        u.setAge(r.age());
        u.setHeightCm(r.heightCm());
        u.setWeightKg(r.weightKg());
        u.setActivityLevel(r.activityLevel());
        u.setGoal(r.goal());
        if (r.weeklyWorkoutTarget() != null) {
            u.setWeeklyWorkoutTarget(r.weeklyWorkoutTarget());
        }
        userService.applyTargets(u);
        users.save(u);
        nutritionService.refreshToday(u);
        return ProfileResponse.from(u);
    }
}
