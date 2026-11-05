package com.fitnessassist.service;

import com.fitnessassist.config.AppClock;
import com.fitnessassist.dto.MetricDtos.MetricRequest;
import com.fitnessassist.dto.MetricDtos.MetricResponse;
import com.fitnessassist.exception.ResourceNotFoundException;
import com.fitnessassist.model.BodyMetric;
import com.fitnessassist.model.User;
import com.fitnessassist.repository.BodyMetricRepository;
import com.fitnessassist.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MetricService {

    private final BodyMetricRepository metrics;
    private final CurrentUser currentUser;
    private final AppClock clock;

    /** One entry per day: logging again for the same date updates that day's entry. */
    @Transactional
    public MetricResponse log(MetricRequest r) {
        User u = currentUser.get();
        LocalDate date = r.date() == null ? clock.today() : r.date();
        BodyMetric m = metrics.findByUserIdAndDate(u.getId(), date).orElseGet(() -> {
            BodyMetric fresh = new BodyMetric();
            fresh.setUser(u);
            fresh.setDate(date);
            return fresh;
        });
        m.setWeightKg(r.weightKg());
        m.setWaistCm(r.waistCm());
        m.setChestCm(r.chestCm());
        m.setHipsCm(r.hipsCm());
        m.setArmCm(r.armCm());
        m.setThighCm(r.thighCm());
        return toResponse(metrics.save(m));
    }

    @Transactional(readOnly = true)
    public List<MetricResponse> range(LocalDate from, LocalDate to) {
        LocalDate end = to == null ? clock.today() : to;
        LocalDate start = from == null ? end.minusDays(90) : from;
        return metrics.findByUserIdAndDateBetweenOrderByDateAsc(currentUser.get().getId(), start, end)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public void delete(Long id) {
        BodyMetric m = metrics.findByIdAndUserId(id, currentUser.get().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Metric entry not found"));
        metrics.delete(m);
    }

    private MetricResponse toResponse(BodyMetric m) {
        return new MetricResponse(m.getId(), m.getDate(), m.getWeightKg(), m.getWaistCm(),
                m.getChestCm(), m.getHipsCm(), m.getArmCm(), m.getThighCm());
    }
}
