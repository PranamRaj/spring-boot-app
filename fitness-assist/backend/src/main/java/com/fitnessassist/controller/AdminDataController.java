package com.fitnessassist.controller;

import com.fitnessassist.service.data.AdminDataService;
import com.fitnessassist.service.data.AdminDataService.Option;
import com.fitnessassist.service.data.AdminDataService.Page;
import com.fitnessassist.service.data.AdminDataService.TableInfo;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Generic table management for admins: every table in the app can be listed, searched,
 * filtered, created, edited and deleted. Restricted to ADMIN by SecurityConfig (/api/admin/**).
 */
@RestController
@RequestMapping("/api/admin/data")
@RequiredArgsConstructor
@Tag(name = "Admin data")
public class AdminDataController {

    private final AdminDataService data;

    @GetMapping
    public List<TableInfo> tables() {
        return data.tables();
    }

    /** Any extra query parameter filters by that column, e.g. ?user=5 or ?mealType=LUNCH. */
    @GetMapping("/{table}")
    public Page list(@PathVariable String table,
                     @RequestParam(defaultValue = "0") int page,
                     @RequestParam(defaultValue = "25") int size,
                     @RequestParam(required = false) String q,
                     @RequestParam(required = false) String sort,
                     @RequestParam(required = false) String dir,
                     @RequestParam Map<String, String> params) {
        return data.list(table, page, size, q, sort, dir, params);
    }

    @GetMapping("/{table}/options")
    public List<Option> options(@PathVariable String table, @RequestParam(required = false) String q) {
        return data.options(table, q);
    }

    @GetMapping("/{table}/{id}")
    public Map<String, Object> get(@PathVariable String table, @PathVariable Long id) {
        return data.get(table, id);
    }

    @PostMapping("/{table}")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(@PathVariable String table, @RequestBody Map<String, Object> body) {
        return data.create(table, body);
    }

    @PutMapping("/{table}/{id}")
    public Map<String, Object> update(@PathVariable String table, @PathVariable Long id,
                                      @RequestBody Map<String, Object> body) {
        return data.update(table, id, body);
    }

    @DeleteMapping("/{table}/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String table, @PathVariable Long id) {
        data.delete(table, id);
    }
}
