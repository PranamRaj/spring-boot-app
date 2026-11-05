package com.fitnessassist.controller;

import com.fitnessassist.dto.MetricDtos.MetricRequest;
import com.fitnessassist.dto.MetricDtos.MetricResponse;
import com.fitnessassist.service.MetricService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/metrics")
@RequiredArgsConstructor
@Tag(name = "Body metrics")
public class MetricController {

    private final MetricService metricService;

    @GetMapping
    public List<MetricResponse> range(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return metricService.range(from, to);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MetricResponse log(@Valid @RequestBody MetricRequest request) {
        return metricService.log(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        metricService.delete(id);
    }
}
