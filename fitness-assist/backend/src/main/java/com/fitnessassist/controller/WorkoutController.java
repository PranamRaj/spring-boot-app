package com.fitnessassist.controller;

import com.fitnessassist.dto.WorkoutDtos.AddSetRequest;
import com.fitnessassist.dto.WorkoutDtos.SessionResponse;
import com.fitnessassist.dto.WorkoutDtos.StartSessionRequest;
import com.fitnessassist.service.WorkoutService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workouts/sessions")
@RequiredArgsConstructor
@Tag(name = "Workouts")
public class WorkoutController {

    private final WorkoutService workoutService;

    @GetMapping
    public List<SessionResponse> list() {
        return workoutService.list();
    }

    @GetMapping("/{id}")
    public SessionResponse get(@PathVariable Long id) {
        return workoutService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SessionResponse start(@Valid @RequestBody StartSessionRequest request) {
        return workoutService.start(request);
    }

    @PostMapping("/{id}/sets")
    @ResponseStatus(HttpStatus.CREATED)
    public SessionResponse addSet(@PathVariable Long id, @Valid @RequestBody AddSetRequest request) {
        return workoutService.addSet(id, request);
    }

    @DeleteMapping("/{id}/sets/{setId}")
    public SessionResponse deleteSet(@PathVariable Long id, @PathVariable Long setId) {
        return workoutService.deleteSet(id, setId);
    }

    @PostMapping("/{id}/finish")
    public SessionResponse finish(@PathVariable Long id) {
        return workoutService.finish(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        workoutService.delete(id);
    }
}
