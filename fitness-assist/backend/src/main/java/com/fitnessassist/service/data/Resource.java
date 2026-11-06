package com.fitnessassist.service.data;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;

import java.util.List;
import java.util.function.BiConsumer;
import java.util.function.Consumer;
import java.util.function.Function;

/** One database table exposed in the admin data manager, plus the business rules to apply around writes. */
@Getter
public class Resource {

    private final String key;
    private final String label;
    private final String group;
    private final String description;
    private final List<FieldDef> fields;

    @JsonIgnore
    private final Class<?> entity;
    @JsonIgnore
    private Function<Object, String> labeler = e -> String.valueOf(EntityAccess.read(e, "id"));
    /** Runs after the submitted values are applied and before the row is written. Arguments: entity, isCreate. */
    @JsonIgnore
    private BiConsumer<Object, Boolean> beforeSave = (e, c) -> { };
    /** Runs after a write or delete has been flushed, e.g. to recompute totals. Arguments: entity, wasDeleted. */
    @JsonIgnore
    private BiConsumer<Object, Boolean> afterChange = (e, d) -> { };
    /** Replaces the default delete when removing a row needs more than one statement. */
    @JsonIgnore
    private Consumer<Object> deleter;

    public Resource(String key, String label, String group, String description, Class<?> entity, List<FieldDef> fields) {
        this.key = key;
        this.label = label;
        this.group = group;
        this.description = description;
        this.entity = entity;
        this.fields = fields;
    }

    public Resource labeler(Function<Object, String> f) {
        this.labeler = f;
        return this;
    }

    public Resource beforeSave(BiConsumer<Object, Boolean> f) {
        this.beforeSave = f;
        return this;
    }

    public Resource afterChange(BiConsumer<Object, Boolean> f) {
        this.afterChange = f;
        return this;
    }

    public Resource deleter(Consumer<Object> f) {
        this.deleter = f;
        return this;
    }

    public FieldDef field(String name) {
        return fields.stream().filter(f -> f.getName().equals(name)).findFirst().orElse(null);
    }
}
