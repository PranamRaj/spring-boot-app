package com.fitnessassist.controller;

import com.fitnessassist.dto.AdminDtos.*;
import com.fitnessassist.dto.AuthDtos.RegisterRequest;
import com.fitnessassist.service.AdminService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Coach/admin endpoints. SecurityConfig restricts /api/admin/** to the ADMIN role. */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/overview")
    public Overview overview() {
        return adminService.overview();
    }

    @GetMapping("/trainees")
    public List<TraineeRow> trainees() {
        return adminService.trainees();
    }

    @GetMapping("/trainees/{id}")
    public TraineeDetail trainee(@PathVariable Long id) {
        return adminService.detail(id);
    }

    @PostMapping("/trainees")
    @ResponseStatus(HttpStatus.CREATED)
    public TraineeRow create(@Valid @RequestBody RegisterRequest request) {
        return adminService.create(request);
    }

    @PutMapping("/trainees/{id}/status")
    public TraineeRow status(@PathVariable Long id, @Valid @RequestBody StatusRequest request) {
        return adminService.setActive(id, request.active());
    }

    @PutMapping("/trainees/{id}/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@PathVariable Long id, @Valid @RequestBody ResetPasswordRequest request) {
        adminService.resetPassword(id, request.password());
    }

    @PutMapping("/trainees/{id}/notes")
    public Map<String, String> notes(@PathVariable Long id, @Valid @RequestBody NotesRequest request) {
        String saved = adminService.saveNotes(id, request.notes());
        return Map.of("notes", saved == null ? "" : saved);
    }

    @DeleteMapping("/trainees/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        adminService.delete(id);
    }
}
