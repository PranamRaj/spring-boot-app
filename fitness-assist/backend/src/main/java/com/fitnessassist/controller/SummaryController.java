package com.fitnessassist.controller;

import com.fitnessassist.dto.SummaryDtos.WeeklySummaryResponse;
import com.fitnessassist.service.SummaryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/summaries/weekly")
@RequiredArgsConstructor
@Tag(name = "Weekly summaries")
public class SummaryController {

    private final SummaryService summaryService;

    @GetMapping
    public List<WeeklySummaryResponse> list() {
        return summaryService.list();
    }

    /** Builds (or refreshes) the summary for the week containing the given date; defaults to this week so far. */
    @PostMapping("/generate")
    public WeeklySummaryResponse generate(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return summaryService.generateFor(date);
    }
}
