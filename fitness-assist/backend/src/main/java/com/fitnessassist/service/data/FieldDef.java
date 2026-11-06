package com.fitnessassist.service.data;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;

import java.util.Arrays;
import java.util.List;

/**
 * Describes one editable column of a data-manager resource. The same definition drives
 * validation and conversion on the server and the generated form and table in the admin UI.
 */
@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FieldDef {

    public enum Type { STRING, TEXT, INT, DECIMAL, BOOLEAN, DATE, DATETIME, ENUM, REF, PASSWORD }

    private final String name;
    private final String label;
    private final Type type;
    private boolean required;
    private boolean readOnly;
    /** Can be set when the row is created but not changed afterwards. */
    private boolean createOnly;
    /** Shown as a column in the table view. */
    private boolean list = true;
    private Double min;
    private Double max;
    private Integer maxLength;
    private List<String> options;
    /** For REF fields: key of the referenced resource. */
    private String ref;
    private String hint;

    private FieldDef(String name, String label, Type type) {
        this.name = name;
        this.label = label;
        this.type = type;
    }

    public static FieldDef string(String name, String label) {
        return new FieldDef(name, label, Type.STRING).maxLength(255);
    }

    public static FieldDef text(String name, String label, int maxLength) {
        return new FieldDef(name, label, Type.TEXT).maxLength(maxLength).hidden();
    }

    public static FieldDef integer(String name, String label) {
        return new FieldDef(name, label, Type.INT);
    }

    public static FieldDef decimal(String name, String label) {
        return new FieldDef(name, label, Type.DECIMAL);
    }

    public static FieldDef bool(String name, String label) {
        return new FieldDef(name, label, Type.BOOLEAN);
    }

    public static FieldDef date(String name, String label) {
        return new FieldDef(name, label, Type.DATE);
    }

    public static FieldDef dateTime(String name, String label) {
        return new FieldDef(name, label, Type.DATETIME);
    }

    public static FieldDef enumOf(String name, String label, Class<? extends Enum<?>> type) {
        FieldDef f = new FieldDef(name, label, Type.ENUM);
        f.options = Arrays.stream(type.getEnumConstants()).map(Enum::name).toList();
        return f;
    }

    public static FieldDef ref(String name, String label, String resourceKey) {
        FieldDef f = new FieldDef(name, label, Type.REF);
        f.ref = resourceKey;
        return f;
    }

    public static FieldDef password(String name, String label) {
        return new FieldDef(name, label, Type.PASSWORD).hidden().min(8);
    }

    public FieldDef required() {
        this.required = true;
        return this;
    }

    public FieldDef readOnly() {
        this.readOnly = true;
        return this;
    }

    public FieldDef createOnly() {
        this.createOnly = true;
        return this;
    }

    public FieldDef hidden() {
        this.list = false;
        return this;
    }

    public FieldDef min(double v) {
        this.min = v;
        return this;
    }

    public FieldDef max(double v) {
        this.max = v;
        return this;
    }

    public FieldDef range(double min, double max) {
        return min(min).max(max);
    }

    public FieldDef maxLength(int n) {
        this.maxLength = n;
        return this;
    }

    public FieldDef hint(String h) {
        this.hint = h;
        return this;
    }
}
