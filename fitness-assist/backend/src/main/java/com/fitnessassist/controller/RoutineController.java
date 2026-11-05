package com.fitnessassist.controller;

import com.fitnessassist.dto.RoutineDtos.RoutineRequest;
import com.fitnessassist.dto.RoutineDtos.RoutineResponse;
import com.fitnessassist.service.RoutineService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/routines")
@RequiredArgsConstructor
@Tag(name = "Routines")
public class RoutineController {

    private final RoutineService routineService;

    @GetMapping
    public List<RoutineResponse> list() {
        return routineService.list();
    }

    @GetMapping("/{id}")
    public RoutineResponse get(@PathVariable Long id) {
        return routineService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoutineResponse create(@Valid @RequestBody RoutineRequest request) {
        return routineService.create(request);
    }

    @PutMapping("/{id}")
    public RoutineResponse update(@PathVariable Long id, @Valid @RequestBody RoutineRequest request) {
        return routineService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        routineService.delete(id);
    }
}
