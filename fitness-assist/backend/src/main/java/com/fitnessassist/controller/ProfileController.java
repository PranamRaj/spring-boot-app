package com.fitnessassist.controller;

import com.fitnessassist.dto.ProfileDtos.ProfileResponse;
import com.fitnessassist.dto.ProfileDtos.UpdateProfileRequest;
import com.fitnessassist.service.ProfileService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@Tag(name = "Profile")
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ProfileResponse get() {
        return profileService.get();
    }

    @PutMapping
    public ProfileResponse update(@Valid @RequestBody UpdateProfileRequest request) {
        return profileService.update(request);
    }
}
