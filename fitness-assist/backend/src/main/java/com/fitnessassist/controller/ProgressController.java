package com.fitnessassist.controller;

import com.fitnessassist.dto.ProgressDtos.StrengthTrend;
import com.fitnessassist.dto.ProgressDtos.VolumePoint;
import com.fitnessassist.dto.ProgressDtos.WeightTrend;
import com.fitnessassist.service.ProgressService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
@Tag(name = "Progress")
public class ProgressController {

    private final ProgressService progressService;

    @GetMapping("/weight")
    public WeightTrend weight(@RequestParam(defaultValue = "90") int days) {
        return progressService.weight(Math.min(Math.max(days, 7), 730));
    }

    @GetMapping("/strength/{exerciseId}")
    public StrengthTrend strength(@PathVariable Long exerciseId) {
        return progressService.strength(exerciseId);
    }

    @GetMapping("/volume")
    public List<VolumePoint> volume(@RequestParam(defaultValue = "12") int weeks) {
        return progressService.weeklyVolume(Math.min(Math.max(weeks, 1), 52));
    }
}
